import { getBranches, getBranch, createBranch } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const branches = await getBranches();
      return res.status(200).json({ branches: branches || [] });
    }

    if (req.method === 'POST') {
      const { name, code } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      const branch = await createBranch(name, code);
      return res.status(201).json({ id: branch.id, name: branch.name, code: branch.code });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
