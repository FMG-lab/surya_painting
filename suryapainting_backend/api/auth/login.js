import db from '../../lib/db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Query user from database - hardcoded check for demo
    // In production, use bcrypt to hash passwords
    const validUsers = [
      { id: 1, email: 'admin@surya.com', password: 'admin123', name: 'Admin', role: 'admin' },
      { id: 2, email: 'tech@surya.com', password: 'tech123', name: 'Technician', role: 'technician' },
      { id: 3, email: 'manager@surya.com', password: 'manager123', name: 'Manager', role: 'manager' },
    ];

    const user = validUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate simple JWT-like token (in production, use proper JWT library)
    const token = Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Date.now()
    })).toString('base64');

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
