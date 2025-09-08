// api/verify-license.js
// Properly aligned with your actual table structure

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
    const { machine_id, product, version } = req.body;

    if (!machine_id) {
      return res.status(400).json({
        status: 'invalid',
        message: 'Missing machine_id',
        buy_url: 'https://www.deltavsolutions.com/purchase'
      });
    }

    console.log('License check request:', {
      machine_id: machine_id?.substring(0, 8) + '...',
      product,
      version,
      timestamp: new Date().toISOString()
    });

    // Development license check
    if (['test123', 'development', 'debug'].includes(machine_id)) {
      return res.json({
        status: 'valid',
        license_type: 'development',
        expires: '2025-12-31',
        message: 'Development license'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({
        status: 'invalid',
        message: 'Server configuration error',
        buy_url: 'https://www.deltavsolutions.com/support'
      });
    }

    // Query using your actual table structure
    const response = await fetch(`${supabaseUrl}/rest/v1/licenses?machine_id=eq.${machine_id}&paid=eq.true&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Supabase query failed:', response.status, await response.text());
      return res.status(500).json({
        status: 'invalid',
        message: 'Database error',
        buy_url: 'https://www.deltavsolutions.com/support'
      });
    }

    const licenses = await response.json();

    // If no paid license found
    if (!licenses || licenses.length === 0) {
      return res.json({
        status: 'invalid',
        message: 'No valid license found for this machine',
        buy_url: 'https://www.deltavsolutions.com/purchase'
      });
    }

    const licenseInfo = licenses[0];

    // Valid license found - return using your table's actual fields
    return res.json({
      status: 'valid',
      license_key: licenseInfo.license_key,
      customer_email: licenseInfo.customer_email,
      verified_at: new Date().toISOString(),
      message: 'License is valid'
    });

  } catch (error) {
    console.error('License verification error:', error);
    
    return res.status(500).json({
      status: 'invalid',
      message: 'Internal server error during license verification',
      buy_url: 'https://www.deltavsolutions.com/support'
    });
  }
}
