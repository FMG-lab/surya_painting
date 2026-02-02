import { getStaff, createStaff } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const staff = await getStaff();
      return res.status(200).json({ staff: staff || [] });
    }

    if (req.method === 'POST') {
      const { email, full_name, role } = req.body;
      if (!email || !role) return res.status(400).json({ error: 'Email and role are required' });
      const newStaff = await createStaff(email, full_name, role);
      return res.status(201).json({ id: newStaff.id, email: newStaff.email, full_name: newStaff.full_name, role: newStaff.role });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
