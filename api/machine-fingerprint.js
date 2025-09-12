// Secure machine fingerprinting system for non-transferable licenses
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hardware_info } = req.body;
    
    if (!hardware_info || !hardware_info.cpu_id || !hardware_info.motherboard_id) {
      return res.status(400).json({
        error: 'Hardware information required',
        required: ['cpu_id', 'motherboard_id']
      });
    }

    // Create secure, non-reversible machine fingerprint
    const crypto = require('crypto');
    const fingerprintData = [
      hardware_info.cpu_id,
      hardware_info.motherboard_id,
      hardware_info.bios_serial || '',
      hardware_info.mac_address || '',
      process.env.FINGERPRINT_SALT || 'default_salt' // Add salt for extra security
    ].join('|');
    
    const machine_fingerprint = crypto
      .createHash('sha256')
      .update(fingerprintData)
      .digest('hex');

    // Generate payment URL with embedded machine fingerprint
    const payment_url = `${process.env.PAYMENT_BASE_URL || 'https://your-domain.com'}/payment?mf=${machine_fingerprint}`;

    return res.json({
      success: true,
      machine_fingerprint,
      payment_url,
      message: 'Machine fingerprint generated successfully'
    });

  } catch (error) {
    console.error('Machine fingerprint error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}