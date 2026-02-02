import { getBranch } from '../../lib/db.js';

const mockBranches = {
  1: { id: 1, name: 'Surya Painting - Jakarta Pusat', city: 'Jakarta', address: 'Jl. Gatot Subroto, Jakarta', phone: '+62-21-1234567', email: 'jakarta-pusat@surya.com', hours: '08:00 - 18:00' },
  2: { id: 2, name: 'Surya Painting - Jakarta Barat', city: 'Jakarta', address: 'Jl. Hayam Wuruk, Jakarta', phone: '+62-21-2345678', email: 'jakarta-barat@surya.com', hours: '08:00 - 18:00' },
  3: { id: 3, name: 'Surya Painting - Jakarta Timur', city: 'Jakarta', address: 'Jl. Matraman, Jakarta', phone: '+62-21-3456789', email: 'jakarta-timur@surya.com', hours: '08:00 - 18:00' },
  4: { id: 4, name: 'Surya Painting - Jakarta Selatan', city: 'Jakarta', address: 'Jl. Kemang, Jakarta', phone: '+62-21-4567890', email: 'jakarta-selatan@surya.com', hours: '08:00 - 18:00' },
  5: { id: 5, name: 'Surya Painting - Bogor', city: 'Bogor', address: 'Jl. Pemuda, Bogor', phone: '+62-251-5678901', email: 'bogor@surya.com', hours: '08:00 - 18:00' },
  6: { id: 6, name: 'Surya Painting - Bekasi', city: 'Bekasi', address: 'Jl. A Yani, Bekasi', phone: '+62-21-6789012', email: 'bekasi@surya.com', hours: '08:00 - 18:00' }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { id } = req.query;
    
    // Try database first
    try {
      const branch = await getBranch(id);
      if (branch) {
        return res.status(200).json({ data: branch });
      }
    } catch (dbError) {
      console.log('Database unavailable, using mock data');
    }
    
    // Fallback to mock
    const mockBranch = mockBranches[id];
    if (mockBranch) {
      return res.status(200).json({ data: mockBranch });
    }
    
    return res.status(404).json({ error: 'Branch not found' });
  } catch (error) {
    console.error('Branch detail error:', error);
    const mockBranch = mockBranches[req.query.id];
    if (mockBranch) {
      return res.status(200).json({ data: mockBranch });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}
