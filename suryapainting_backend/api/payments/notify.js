import { updatePaymentStatus } from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const { order_id, transaction_status, gross_amount } = req.body;
      if (!order_id || !transaction_status) {
        return res.status(400).json({ error: 'order_id and transaction_status required' });
      }

      const updated = await updatePaymentStatus(order_id, transaction_status, gross_amount);
      console.log(`Payment notification: ${order_id} → ${transaction_status}`);
      
      return res.status(200).json({ success: true, message: 'Payment notification received', data: updated });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
