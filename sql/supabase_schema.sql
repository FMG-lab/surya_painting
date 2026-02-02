-- Supabase schema for Surya Painting
-- Contains tables, RLS policies, assign_queue function and seed data

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Branches
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  capacity integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Users (supabase auth users mirrored here)
-- role ∈ ('super_admin','branch_manager','mechanic')
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY, -- should match auth.uid()
  email text UNIQUE,
  full_name text,
  role text NOT NULL CHECK (role IN ('super_admin','branch_manager','mechanic')),
  branch_id uuid REFERENCES branches(id), -- manager/mechanic bound to a single branch
  created_at timestamptz DEFAULT now()
);

-- Devices (guest devices)
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL, -- device generated UUID from client
  push_token text,
  created_at timestamptz DEFAULT now()
);

-- Services (pelek/body/pretelan)
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES devices(id),
  guest_name text,
  guest_phone text,
  plate_number text,
  branch_id uuid REFERENCES branches(id) NOT NULL,
  total_price bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_payment', -- pending_payment|paid|in_queue|in_progress|completed|closed
  queue_no integer,
  booking_token text, -- short token for guest access (issued by backend)
  created_at timestamptz DEFAULT now()
);

-- Booking services (many-to-many)
CREATE TABLE IF NOT EXISTS booking_services (
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id),
  PRIMARY KEY (booking_id, service_id)
);

-- Payments (manual transfer)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  method text DEFAULT 'manual_transfer',
  proof_path text, -- storage path in Supabase Storage (private)
  status text DEFAULT 'pending_review', -- pending_review|confirmed|rejected
  uploaded_at timestamptz DEFAULT now(),
  verified_by uuid REFERENCES users(id),
  verified_at timestamptz,
  notes text
);

-- Branch queues counter per day (for atomic queue number assignment)
CREATE TABLE IF NOT EXISTS branch_queues (
  branch_id uuid REFERENCES branches(id),
  day date DEFAULT current_date,
  last_queue_no integer DEFAULT 0,
  PRIMARY KEY (branch_id, day)
);

-- Work progress updates by mechanics
CREATE TABLE IF NOT EXISTS work_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  mechanic_id uuid REFERENCES users(id),
  status text NOT NULL, -- e.g. started|in_progress|paused|done
  notes text,
  photos text[], -- array of storage paths
  created_at timestamptz DEFAULT now()
);

-- Function: assign_queue - returns next queue number for branch for a given date
CREATE OR REPLACE FUNCTION assign_queue(target_branch uuid, target_day date DEFAULT current_date)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  next_no integer;
BEGIN
  LOOP
    -- try to insert; on conflict update last_queue_no
    INSERT INTO branch_queues (branch_id, day, last_queue_no)
    VALUES (target_branch, target_day, 1)
    ON CONFLICT (branch_id, day) DO UPDATE
      SET last_queue_no = branch_queues.last_queue_no + 1
    RETURNING last_queue_no INTO next_no;

    IF next_no IS NOT NULL THEN
      RETURN next_no;
    END IF;
  END LOOP;
END;
$$;

-- -----------------------------
-- Row Level Security (RLS) policies
-- -----------------------------

-- Enable RLS where applicable
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Policy: Super admin full access to branches
CREATE POLICY "super_admin_branches" ON branches
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'super_admin'
  )
);

-- Policy: Branch manager may SELECT their own branch
CREATE POLICY "manager_select_own_branch" ON branches
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'branch_manager' AND u.branch_id = branches.id
  )
);

-- Note: only super_admin can INSERT/UPDATE/DELETE branches via server endpoints (no public insert/update policies)


-- Helper: check if current auth user is super_admin
-- (We use a policy expression referencing users table)

-- Policy: Super admin full access
CREATE POLICY "super_admin_all" ON bookings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'super_admin'
  )
);

CREATE POLICY "super_admin_payments" ON payments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'super_admin'
  )
);

CREATE POLICY "super_admin_work_progress" ON work_progress
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'super_admin'
  )
);

CREATE POLICY "super_admin_users" ON users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u2
    WHERE u2.id = auth.uid() AND u2.role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u2
    WHERE u2.id = auth.uid() AND u2.role = 'super_admin'
  )
);

-- Policy: Branch manager may SELECT/UPDATE bookings & payments for their branch
CREATE POLICY "manager_read_update_bookings" ON bookings
FOR SELECT, UPDATE USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'branch_manager' AND u.branch_id = bookings.branch_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'branch_manager' AND u.branch_id = bookings.branch_id
  )
);

CREATE POLICY "manager_read_update_payments" ON payments
FOR SELECT, UPDATE USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN bookings b ON b.id = payments.booking_id
    WHERE u.id = auth.uid() AND u.role = 'branch_manager' AND u.branch_id = b.branch_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN bookings b ON b.id = payments.booking_id
    WHERE u.id = auth.uid() AND u.role = 'branch_manager' AND u.branch_id = b.branch_id
  )
);

-- Policy: Mechanic may INSERT work_progress and UPDATE their own updates for bookings in their branch
CREATE POLICY "mechanic_insert_work" ON work_progress
FOR INSERT USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN bookings b ON b.id = NEW.booking_id
    WHERE u.id = auth.uid() AND u.role = 'mechanic' AND u.branch_id = b.branch_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN bookings b ON b.id = NEW.booking_id
    WHERE u.id = auth.uid() AND u.role = 'mechanic' AND u.branch_id = b.branch_id
  )
);

CREATE POLICY "mechanic_update_own" ON work_progress
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'mechanic' AND work_progress.mechanic_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role = 'mechanic' AND work_progress.mechanic_id = auth.uid()
  )
);

-- Policy: Users may view their own user record
CREATE POLICY "users_self_select_update" ON users
FOR SELECT, UPDATE USING (
  auth.uid() = id
) WITH CHECK (
  auth.uid() = id
);

-- Note: Bookings & payments inserts (from client) are intended to be proxied via Vercel functions or Supabase Edge Functions
-- that run with the Service Role (which bypasses RLS). We intentionally do not open public-insert policies for bookings/payments here.

-- -----------------------------
-- Seed data (sample branch + users + services)
-- -----------------------------

-- Sample branch
INSERT INTO branches (id, name, address, capacity)
VALUES ('00000000-0000-0000-0000-000000000001','Surya Painting - Cabang Utama','Jl. Contoh No.1', 5)
ON CONFLICT DO NOTHING;

-- Additional sample branch
INSERT INTO branches (id, name, address, capacity)
VALUES ('00000000-0000-0000-0000-000000000002','Surya Painting - Cabang Selatan','Jl. Contoh No.2', 3)
ON CONFLICT DO NOTHING;

-- Sample services
INSERT INTO services (id, name, price)
VALUES
  ('10000000-0000-0000-0000-000000000001','Pelek', 150000),
  ('10000000-0000-0000-0000-000000000002','Body', 250000),
  ('10000000-0000-0000-0000-000000000003','Pretelan', 100000)
ON CONFLICT DO NOTHING;

-- Sample super_admin user (replace id with actual auth.uid() when creating a real account)
INSERT INTO users (id, email, full_name, role)
VALUES ('11111111-1111-1111-1111-111111111111','superadmin@surya.local','Super Admin','super_admin')
ON CONFLICT DO NOTHING;

-- Sample branch manager bound to branch
INSERT INTO users (id, email, full_name, role, branch_id)
VALUES ('22222222-2222-2222-2222-222222222222','manager@cabang.local','Manager Cabang','branch_manager','00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Sample mechanic bound to branch
INSERT INTO users (id, email, full_name, role, branch_id)
VALUES ('33333333-3333-3333-3333-333333333333','montir@cabang.local','Montir Cabang','mechanic','00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Function: verify_payment - verifies a manual payment and assigns queue atomically
CREATE OR REPLACE FUNCTION verify_payment(p_payment_id uuid, p_verifier uuid)
RETURNS TABLE(queue_no integer) LANGUAGE plpgsql AS $$
DECLARE
  v_booking_id uuid;
  v_branch uuid;
  v_payment_status text;
  v_queue integer;
BEGIN
  -- lock and fetch payment + booking
  SELECT p.booking_id, p.status, b.branch_id
  INTO v_booking_id, v_payment_status, v_branch
  FROM payments p
  JOIN bookings b ON b.id = p.booking_id
  WHERE p.id = p_payment_id
  FOR UPDATE;

  IF v_payment_status IS NULL THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF v_payment_status != 'pending_review' THEN
    RAISE EXCEPTION 'Payment is not pending_review';
  END IF;

  -- assign queue (uses assign_queue function)
  v_queue := assign_queue(v_branch);

  -- update payment
  UPDATE payments SET status = 'confirmed', verified_by = p_verifier, verified_at = now()
  WHERE id = p_payment_id;

  -- update booking
  UPDATE bookings SET queue_no = v_queue, status = 'in_queue' WHERE id = v_booking_id;

  RETURN QUERY SELECT v_queue;
END;
$$;

-- Function: assign_queue_for_booking - assign queue atomically for a specific booking
CREATE OR REPLACE FUNCTION assign_queue_for_booking(p_booking_id uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  v_branch uuid;
  v_queue integer;
BEGIN
  SELECT branch_id INTO v_branch FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF v_branch IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  v_queue := assign_queue(v_branch);

  UPDATE bookings SET queue_no = v_queue, status = 'in_queue' WHERE id = p_booking_id;

  RETURN v_queue;
END;
$$;

-- End of schema file
