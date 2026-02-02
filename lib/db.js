import { Pool } from 'pg';

let dbUrl = process.env.DATABASE_URL;
// For Supabase pooler, need to handle SSL properly
if (dbUrl && !dbUrl.includes('sslmode=no-verify')) {
  // Replace require with no-verify for connection pool
  dbUrl = dbUrl.replace('sslmode=require', 'sslmode=no-verify');
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  // Connection pool settings for pgBouncer
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function getBranches() {
  const result = await pool.query('SELECT id, name, code, created_at FROM branches ORDER BY created_at DESC');
  return result.rows;
}

export async function getBranch(id) {
  const result = await pool.query('SELECT id, name, code, created_at FROM branches WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createBranch(name, code) {
  const result = await pool.query('INSERT INTO branches (name, code) VALUES ($1, $2) RETURNING id, name, code, created_at', [name, code]);
  return result.rows[0];
}

export async function updateBranch(id, name, code) {
  const result = await pool.query('UPDATE branches SET name = $1, code = $2 WHERE id = $3 RETURNING id, name, code, created_at', [name, code, id]);
  return result.rows[0] || null;
}

export async function deleteBranch(id) {
  const result = await pool.query('DELETE FROM branches WHERE id = $1 RETURNING id', [id]);
  return result.rows[0] || null;
}

export async function createBooking(guestName, guestPhone, branchId) {
  const result = await pool.query('INSERT INTO bookings (guest_name, guest_phone, branch_id, status) VALUES ($1, $2, $3, $4) RETURNING id, booking_token', [guestName, guestPhone, branchId, 'pending']);
  return result.rows[0];
}

export async function getBookingStatus(bookingCode) {
  const result = await pool.query('SELECT id, booking_token, guest_name, guest_phone, branch_id, status, created_at FROM bookings WHERE booking_token = $1', [bookingCode]);
  return result.rows[0] || null;
}

export async function updatePaymentStatus(orderId, status, grossAmount) {
  const result = await pool.query('UPDATE bookings SET status = $1, payment_status = $2 WHERE booking_token = $3 RETURNING id, booking_token, status, payment_status', [status, 'paid', orderId]);
  return result.rows[0] || null;
}

export async function getStaff() {
  const result = await pool.query("SELECT id, email, full_name, role, created_at FROM private.users WHERE role IN ('manager', 'technician') ORDER BY created_at DESC");
  return result.rows;
}

export async function createStaff(email, fullName, role) {
  const result = await pool.query('INSERT INTO private.users (id, email, full_name, role) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING id, email, full_name, role', [email, fullName, role]);
  return result.rows[0];
}

export async function updateTaskProgress(taskId, status, progressNotes) {
  const result = await pool.query('UPDATE tasks SET status = $1, progress_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING id, status, updated_at', [status, progressNotes, taskId]);
  return result.rows[0] || null;
}

export default pool;