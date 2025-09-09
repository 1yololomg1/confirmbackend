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

  const { machine_id, product, version } = req.body;

  if (!machine_id) {
    return res.status(400).json({
      status: 'invalid',
      message: 'Machine ID is required',
      action: 'purchase_required'
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Query for active, non-expired license
    const currentDate = new Date().toISOString();
    const response = await fetch(
      `${supabaseUrl}/rest/v1/licenses?machine_id=eq.${machine_id}&status=eq.active&expires_at=gte.${currentDate}&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Database error: ${response.status}`);
    }

    const licenses = await response.json();

    if (!licenses || licenses.length === 0) {
      return res.json({
        status: 'invalid',
        message: 'No valid license found for this machine',
        action: 'purchase_required',
        purchase_url: `https://deltavsolutions.com/purchase?machine_id=${machine_id}`
      });
    }

    const license = licenses[0];
    
    // Calculate days remaining
    const expiryDate = new Date(license.expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    // Update verification tracking
    await fetch(`${supabaseUrl}/rest/v1/licenses?id=eq.${license.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        last_verified_at: new Date().toISOString(),
        verification_count: (license.verification_count || 0) + 1
      })
    });

    // Log audit event
    await fetch(`${supabaseUrl}/rest/v1/license_audit_log`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        license_id: license.id,
        action: 'verify_license',
        details: { product, version, ip: req.headers['x-forwarded-for'] || 'unknown' }
      })
    });

    return res.json({
      status: 'valid',
      license_key: license.license_key,
      license_type: license.license_type,
      customer_email: license.customer_email,
      expires_at: license.expires_at,
      days_remaining: daysRemaining,
      features: license.features || {},
      verified_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('License verification error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during license verification',
      action: 'contact_support'
    });
  }
}
