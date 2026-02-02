-- 001_init.sql - minimal schema required for integration tests

-- Drop all objects in the public and private schemas to allow repeatable runs
-- WARNING: This will remove ALL tables, functions, types, sequences, etc. in those schemas.
-- Ensure you have the correct permissions and this is intentional before running in production.

-- Guard: only allow destructive reset when one of the following is true:
--  * session GUC `surya.reset_schema` is set to 'true', OR
--  * database name contains 'test', OR
--  * current user looks like a CI user (contains 'ci').
DO $$
BEGIN
  IF NOT (
    current_setting('surya.reset_schema', true) = 'true'
    OR current_database() ILIKE '%test%'
    OR current_user ILIKE '%ci%'
  ) THEN
    RAISE EXCEPTION 'Refusing to perform destructive schema drop: set session parameter "surya.reset_schema" to ''true'' or run against a test DB (db name contains "test") or as a CI user.';
  END IF;
END;
$$;

DROP SCHEMA IF EXISTS public CASCADE;
DROP SCHEMA IF EXISTS private CASCADE;
CREATE SCHEMA public;
CREATE SCHEMA private;
-- restore default privileges on public and private schemas
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA private TO postgres;
GRANT ALL ON SCHEMA private TO public; 

-- enable uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Seeds for test/CI: create private.users and insert deterministic test users (admin/manager/technician)
CREATE TABLE IF NOT EXISTS private.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  role text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO private.users (id, email, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001','admin@example.com','Admin','admin'),
  ('00000000-0000-0000-0000-000000000002','manager@example.com','Manager','manager'),
  ('00000000-0000-0000-0000-000000000003','tech@example.com','Technician','technician')
ON CONFLICT DO NOTHING;

-- user claims mapping for tests: store role/claims and expose helper view for JWT payloads
CREATE TABLE IF NOT EXISTS private.user_claims (
  user_id uuid PRIMARY KEY REFERENCES private.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  claims jsonb DEFAULT '{}'::jsonb
);

INSERT INTO private.user_claims (user_id, role, claims)
SELECT id, role, jsonb_build_object('role', role, 'email', email)
FROM private.users
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, claims = EXCLUDED.claims;

DROP VIEW IF EXISTS private.test_jwt_payloads;
CREATE VIEW private.test_jwt_payloads AS
SELECT u.id AS sub, u.email, uc.role, uc.claims
FROM private.users u
JOIN private.user_claims uc ON uc.user_id = u.id;

COMMENT ON VIEW private.test_jwt_payloads IS 'Helper view: select from here to get example JWT payloads for seeded users. Use SUPABASE_SERVICE_ROLE_KEY to sign as HS256 for tests.';

-- branches
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  created_at timestamptz DEFAULT now()
);

-- bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text,
  guest_phone text,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  booking_token text,
  status text,
  created_at timestamptz DEFAULT now()
);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  amount integer,
  proof_path text,
  status text,
  created_at timestamptz DEFAULT now()
);

-- work_progress
CREATE TABLE IF NOT EXISTS work_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  assigned_to text,
  status text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Minimal verify_payment RPC (idempotent): updates payment status to 'verified' and returns queue_no = 1
CREATE OR REPLACE FUNCTION verify_payment(p_payment_id uuid, p_verifier text)
RETURNS TABLE(queue_no integer) AS $$
BEGIN
  UPDATE payments SET status = 'verified' WHERE id = p_payment_id;
  RETURN QUERY SELECT 1;
END;
$$ LANGUAGE plpgsql;

-- Note: Adjust or replace this function with your real RPC implementation.
