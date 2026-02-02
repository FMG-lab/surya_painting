import { getBranches } from '../../lib/db.js';

const mockBranches = [
  { id: 1, name: 'Surya Painting - Jakarta Pusat', city: 'Jakarta' },
  { id: 2, name: 'Surya Painting - Jakarta Barat', city: 'Jakarta' },
  { id: 3, name: 'Surya Painting - Jakarta Timur', city: 'Jakarta' },
  { id: 4, name: 'Surya Painting - Jakarta Selatan', city: 'Jakarta' },
  { id: 5, name: 'Surya Painting - Bogor', city: 'Bogor' },
  { id: 6, name: 'Surya Painting - Bekasi', city: 'Bekasi' }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Try database first, fallback to mock
      let branches = [];
      try {
        branches = await getBranches();
        if (branches && branches.length > 0) {
          return res.status(200).json({ data: branches });
        }
      } catch (dbError) {
        console.log('Database unavailable, using mock data');
      }
      // Return mock data
      return res.status(200).json({ data: mockBranches });
    }

    if (req.method === 'POST') {
      const { name, code } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });
      // For now, just return success with mock ID
      return res.status(201).json({ data: { id: Math.random(), name, code } });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Branches API error:', error);
    res.status(200).json({ data: mockBranches });
  }
}
