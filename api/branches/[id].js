import { getBranch } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { id } = req.query;
    const branch = await getBranch(id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.status(200).json({ branch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
