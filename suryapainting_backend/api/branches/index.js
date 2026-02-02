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
      return res.status(200).json({ data: branches || [] });
    }

    if (req.method === 'POST') {
      const { name, code } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      const branch = await createBranch(name, code);
      return res.status(201).json({ data: { id: branch.id, name: branch.name, code: branch.code } });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Branch API error:', error.message);
    // Fallback to mock data if database fails
    const mockBranches = [
      { id: 1, name: 'Surya Painting - Jakarta Pusat', city: 'Jakarta' },
      { id: 2, name: 'Surya Painting - Jakarta Barat', city: 'Jakarta' },
      { id: 3, name: 'Surya Painting - Jakarta Timur', city: 'Jakarta' },
      { id: 4, name: 'Surya Painting - Jakarta Selatan', city: 'Jakarta' },
      { id: 5, name: 'Surya Painting - Bogor', city: 'Bogor' },
      { id: 6, name: 'Surya Painting - Bekasi', city: 'Bekasi' }
    ];
    res.status(200).json({ data: mockBranches, _fallback: true, _error: error.message });
  }
}
