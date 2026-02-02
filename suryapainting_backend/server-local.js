import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getBranches } from './lib/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API running' });
});

// Get branches from database
app.get('/api/branches', async (req, res) => {
  try {
    const branches = await getBranches();
    res.json({
      data: branches && branches.length > 0 ? branches : [
        { id: 1, name: 'Surya Painting Central', city: 'Jakarta' },
        { id: 2, name: 'Surya Painting North', city: 'Bandung' },
        { id: 3, name: 'Surya Painting South', city: 'Surabaya' },
        { id: 4, name: 'Surya Painting East', city: 'Medan' },
        { id: 5, name: 'Surya Painting West', city: 'Padang' },
        { id: 6, name: 'Surya Painting Coast', city: 'Makassar' },
      ]
    });
  } catch (err) {
    console.error('Branch fetch error:', err.message);
    res.json({
      data: [
        { id: 1, name: 'Surya Painting Central', city: 'Jakarta' },
        { id: 2, name: 'Surya Painting North', city: 'Bandung' },
        { id: 3, name: 'Surya Painting South', city: 'Surabaya' },
        { id: 4, name: 'Surya Painting East', city: 'Medan' },
        { id: 5, name: 'Surya Painting West', city: 'Padang' },
        { id: 6, name: 'Surya Painting Coast', city: 'Makassar' },
      ]
    });
  }
});

// Payments banks
app.get('/api/payments/banks', async (req, res) => {
  try {
    res.json({
      data: [
        { id: 1, name: 'BCA', account_number: '123456789', code: 'BCA' },
        { id: 2, name: 'BNI', account_number: '987654321', code: 'BNI' },
        { id: 3, name: 'MANDIRI', account_number: '555666777', code: 'MANDIRI' },
        { id: 4, name: 'CIMB', account_number: '444333222', code: 'CIMB' },
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const validUsers = [
    { id: 1, email: 'admin@surya.com', password: 'admin123', name: 'Admin', role: 'admin' },
    { id: 2, email: 'tech@surya.com', password: 'tech123', name: 'Technician', role: 'technician' },
    { id: 3, email: 'manager@surya.com', password: 'manager123', name: 'Manager', role: 'manager' },
  ];

  const user = validUsers.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })).toString('base64');

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Login endpoint: POST http://localhost:${PORT}/api/auth/login`);
});
