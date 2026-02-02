import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Import health endpoint
import healthHandler from './health.js';

// Health check
app.get('/health', (req, res) => {
  return healthHandler(req, res);
});

// Branches endpoints
import branchesHandler from './branches/index.js';
import branchDetailHandler from './branches/[id].js';

app.get('/api/branches', (req, res) => branchesHandler(req, res));
app.post('/api/branches', (req, res) => branchesHandler(req, res));
app.get('/api/branches/:id', (req, res) => {
  req.query.id = req.params.id;
  return branchDetailHandler(req, res);
});

// Admin branches
import adminBranchesHandler from './admin/branches.js';
app.put('/api/admin/branches/:branchId', (req, res) => {
  req.query.branchId = req.params.branchId;
  return adminBranchesHandler(req, res);
});
app.delete('/api/admin/branches/:branchId', (req, res) => {
  req.query.branchId = req.params.branchId;
  return adminBranchesHandler(req, res);
});

// Admin staff
import adminStaffHandler from './admin/staff.js';
app.get('/api/admin/staff', (req, res) => adminStaffHandler(req, res));
app.post('/api/admin/staff', (req, res) => adminStaffHandler(req, res));

// Bookings
import bookingsHandler from './bookings/index.js';
import bookingStatusHandler from './bookings/status.js';

app.post('/api/bookings', (req, res) => bookingsHandler(req, res));
app.get('/api/bookings/status', (req, res) => bookingStatusHandler(req, res));

// Payments
import paymentsbanksHandler from './payments/banks.js';
import paymentsVerifyHandler from './payments/verify.js';
import paymentsNotifyHandler from './payments/notify.js';

app.get('/api/payments/banks', (req, res) => paymentsbanksHandler(req, res));
app.post('/api/payments/verify', (req, res) => paymentsVerifyHandler(req, res));
app.post('/api/payments/notify', (req, res) => paymentsNotifyHandler(req, res));

// Technician tasks
import techniciansTasksHandler from './technicians/tasks.js';
app.put('/api/technicians/tasks/:taskId', (req, res) => {
  req.query.taskId = req.params.taskId;
  return techniciansTasksHandler(req, res);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
