// api/verify-license.js
// License verification endpoint - Final working version

export default async function handler(req, res) {
  // Set CORS headers
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

    // Get environment variables (now properly set by Supabase integration)
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

    // Query Supabase directly with fetch (no SDK needed)
    const response = await fetch(`${supabaseUrl}/rest/v1/licenses?machine_id=eq.${machine_id}&status=eq.active&select=*`, {
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

    // If no license found
    if (!licenses || licenses.length === 0) {
      return res.json({
        status: 'invalid',
        message: 'License not found for this machine',
        buy_url: 'https://www.deltavsolutions.com/purchase'
      });
    }

    const licenseInfo = licenses[0];
    
    // Check if license is expired
    const expiryDate = new Date(licenseInfo.expires_at || licenseInfo.expires);
    const now = new Date();
    
    if (expiryDate < now) {
      return res.json({
        status: 'invalid',
        message: 'License expired',
        expired_on: licenseInfo.expires_at || licenseInfo.expires,
        buy_url: 'https://www.deltavsolutions.com/renew'
      });
    }

    // Valid license found
    return res.json({
      status: 'valid',
      license_type: licenseInfo.license_type,
      expires: licenseInfo.expires_at || licenseInfo.expires,
      features: licenseInfo.features ? licenseInfo.features.split(',') : [],
      customer_name: licenseInfo.customer_name
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
