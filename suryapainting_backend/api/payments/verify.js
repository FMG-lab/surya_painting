export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const { transaction_id, gross_amount } = req.body;
      if (!transaction_id || !gross_amount) {
        return res.status(400).json({ error: 'transaction_id and gross_amount required' });
      }

      // TODO: Call Midtrans verify API
      // const response = await fetch(`https://api.midtrans.com/v2/${transaction_id}/status`, {...})
      
      return res.status(200).json({ 
        transaction_id: transaction_id,
        status: 'settlement',
        gross_amount: gross_amount
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
