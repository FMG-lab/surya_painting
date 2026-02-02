-- Example RLS policies for Surya Painting
-- Note: adjust table/column names to match your schema and test carefully.

-- 1) bookings: allow users to select their own bookings (by booking_token or id for customers)
-- Enable RLS
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: customers (authenticated) can select rows where booking_token = current_setting('jwt.claims.booking_token', true)
-- CREATE POLICY "customers_select_own" ON bookings FOR SELECT USING (
--   booking_token = current_setting('jwt.claims.booking_token', true)
-- );

-- 2) managers: can view bookings for branches they manage
-- Assuming a helper function manager_branches(uid) returns setof branch ids
-- CREATE POLICY "managers_select_branch" ON bookings FOR SELECT USING (
--   branch_id = ANY (manager_branches(current_setting('request.jwt.claims', true)::json->>'sub'))
-- );

-- 3) technicians: can update progress only for bookings assigned to them
-- ALTER TABLE work_progress ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "technicians_update_own" ON work_progress FOR UPDATE USING (
--   assigned_to = current_setting('jwt.claims.user_id', true)
-- );

-- 4) admins: full access (create roles accordingly)
-- CREATE POLICY "admins_full" ON bookings USING (current_setting('jwt.claims.role', true) = 'admin');

-- Additional notes: set appropriate JWT claims in your Auth system (supabase auth custom claims) so policies can reference current_setting('jwt.claims.<claim>').

-- Example: managers should have claim role='manager' and a helper function manager_branches(uid) can be implemented as a SQL function.
-- Example policies:
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "managers_select_branch" ON bookings FOR SELECT USING (
--   current_setting('jwt.claims.role', true) = 'admin' OR
--   (current_setting('jwt.claims.role', true) = 'manager' AND branch_id = ANY (manager_branches(current_setting('jwt.claims.user_id', true))))
-- );

-- Technicians may insert work_progress rows for bookings assigned to them via assigned_to claim
-- ALTER TABLE work_progress ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "tech_insert_own" ON work_progress FOR INSERT WITH CHECK (
--   current_setting('jwt.claims.role', true) = 'admin' OR
--   (current_setting('jwt.claims.role', true) = 'technician' AND assigned_to = current_setting('jwt.claims.user_id', true))
-- );

-- Admins have full access via role claim
-- CREATE POLICY "admins_full" ON bookings USING (current_setting('jwt.claims.role', true) = 'admin');

