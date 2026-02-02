import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Branches
export async function getBranches() {
  const result = await pool.query('SELECT id, name, code, created_at FROM branches ORDER BY created_at DESC');
  return result.rows;
}

export async function getBranch(id) {
  const result = await pool.query('SELECT id, name, code, created_at FROM branches WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createBranch(name, code) {
  const result = await pool.query(
    'INSERT INTO branches (name, code) VALUES ($1, $2) RETURNING id, name, code, created_at',
    [name, code]
  );
  return result.rows[0];
}

export async function updateBranch(id, name, code) {
  const result = await pool.query(
    'UPDATE branches SET name = $1, code = $2 WHERE id = $3 RETURNING id, name, code, created_at',
    [name, code, id]
  );
  return result.rows[0];
}

export async function deleteBranch(id) {
  await pool.query('DELETE FROM branches WHERE id = $1', [id]);
  return true;
}

// Bookings
export async function createBooking(guestName, guestPhone, branchId) {
  const result = await pool.query(
    'INSERT INTO bookings (guest_name, guest_phone, branch_id, status) VALUES ($1, $2, $3, $4) RETURNING id, guest_name, guest_phone, branch_id, booking_token, status, created_at',
    [guestName, guestPhone, branchId, 'pending']
  );
  return result.rows[0];
}

export async function getBookingStatus(code) {
  const result = await pool.query(
    'SELECT id, guest_name, guest_phone, branch_id, booking_token, status, created_at FROM bookings WHERE booking_token = $1',
    [code]
  );
  return result.rows[0] || null;
}

export async function getBookings() {
  const result = await pool.query('SELECT id, guest_name, guest_phone, branch_id, booking_token, status, created_at FROM bookings ORDER BY created_at DESC');
  return result.rows;
}

// Payments
export async function getPayments() {
  const result = await pool.query('SELECT id, booking_id, amount, proof_path, status, created_at FROM payments ORDER BY created_at DESC');
  return result.rows;
}

export async function verifyPayment(paymentId, verifier) {
  const result = await pool.query('SELECT verify_payment($1, $2) as queue_no', [paymentId, verifier]);
  return result.rows[0].queue_no;
}

export function getPaymentBanks() {
  return [
    { code: 'BCA', name: 'Bank Central Asia', alias: 'bca', swift_code: 'BCAIIDJA' },
    { code: 'BNI', name: 'Bank Negara Indonesia', alias: 'bni', swift_code: 'BNIAIDJA' },
    { code: 'MANDIRI', name: 'Bank Mandiri', alias: 'mandiri', swift_code: 'BMRIIDJA' },
    { code: 'CIMB', name: 'CIMB Niaga', alias: 'cimb', swift_code: 'BNIAIDJA' },
  ];
}

// Staff
export async function getStaff() {
  const result = await pool.query("SELECT id, email, full_name, role, created_at FROM private.users WHERE role IN ('manager', 'technician') ORDER BY created_at DESC");
  return result.rows;
}

export async function createStaff(email, fullName, role) {
  const result = await pool.query(
    'INSERT INTO private.users (id, email, full_name, role) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING id, email, full_name, role, created_at',
    [email, fullName, role]
  );
  return result.rows[0];
}

// Technician Tasks
export async function getTechnicianTasks() {
  const result = await pool.query('SELECT id, booking_id, assigned_to, status, notes, created_at FROM work_progress ORDER BY created_at DESC');
  return result.rows;
}

export async function updateTaskProgress(taskId, status, notes) {
  const result = await pool.query(
    'UPDATE work_progress SET status = $1, notes = $2 WHERE id = $3 RETURNING id, booking_id, assigned_to, status, notes, created_at',
    [status, notes, taskId]
  );
  return result.rows[0];
}

export default pool;
