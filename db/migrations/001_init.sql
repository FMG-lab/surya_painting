-- 001_init.sql - minimal schema required for integration tests

-- enable uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
