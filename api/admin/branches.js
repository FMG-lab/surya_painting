import { updateBranch, deleteBranch } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { branchId } = req.query;

    if (req.method === 'PUT') {
      const { name, code } = req.body;
      if (!name || !code) return res.status(400).json({ error: 'Name and code are required' });
      const updated = await updateBranch(branchId, name, code);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      await deleteBranch(branchId);
      return res.status(200).json({ message: 'Branch deleted' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
