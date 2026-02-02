import { updateTaskProgress } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { taskId } = req.query;

    if (req.method === 'PUT') {
      const { status, progress_notes } = req.body;
      if (!status) return res.status(400).json({ error: 'Status is required' });

      const updated = await updateTaskProgress(taskId, status, progress_notes || '');
      
      return res.status(200).json(updated);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
