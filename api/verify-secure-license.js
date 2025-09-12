// Secure license verification using machine fingerprint (no personal data)
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

  const { hardware_info, product, version } = req.body;

  if (!hardware_info || !hardware_info.cpu_id || !hardware_info.motherboard_id) {
    return res.status(400).json({
      status: 'invalid',
      message: 'Hardware information required for license verification',
      action: 'hardware_check_failed'
    });
  }

  try {
    // Recreate machine fingerprint from hardware info
    const crypto = require('crypto');
    const fingerprintData = [
      hardware_info.cpu_id,
      hardware_info.motherboard_id,
      hardware_info.bios_serial || '',
      hardware_info.mac_address || '',
      process.env.FINGERPRINT_SALT || 'default_salt'
    ].join('|');
    
    const machine_fingerprint = crypto
      .createHash('sha256')
      .update(fingerprintData)
      .digest('hex');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Query for active, non-expired license using fingerprint
    const currentDate = new Date().toISOString();
    const queryUrl = `${supabaseUrl}/rest/v1/secure_licenses?machine_fingerprint=eq.${machine_fingerprint}&status=eq.active&expires_at=gte.${currentDate}&select=*`;
    
    const response = await fetch(queryUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Database error: ${response.status}`);
    }

    const licenses = await response.json();

    if (!licenses || licenses.length === 0) {
      // Check if there's an expired license for this machine
      const expiredQueryUrl = `${supabaseUrl}/rest/v1/secure_licenses?machine_fingerprint=eq.${machine_fingerprint}&select=expires_at,license_type&limit=1`;
      const expiredResponse = await fetch(expiredQueryUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const expiredLicenses = await expiredResponse.json();
      
      if (expiredLicenses && expiredLicenses.length > 0) {
        return res.json({
          status: 'expired',
          message: 'License has expired',
          action: 'renewal_required',
          expired_at: expiredLicenses[0].expires_at,
          license_type: expiredLicenses[0].license_type,
          renewal_url: `${process.env.PAYMENT_BASE_URL || 'https://your-domain.com'}/payment?mf=${machine_fingerprint}&renewal=true`
        });
      }

      return res.json({
        status: 'invalid',
        message: 'No valid license found for this machine',
        action: 'purchase_required',
        purchase_url: `${process.env.PAYMENT_BASE_URL || 'https://your-domain.com'}/payment?mf=${machine_fingerprint}`
      });
    }

    const license = licenses[0];
    
    // Calculate days remaining
    const expiryDate = new Date(license.expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    // Update verification tracking (minimal logging)
    await fetch(`${supabaseUrl}/rest/v1/secure_licenses?id=eq.${license.id}`, {
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

    // Log minimal audit event (no personal data, no IP tracking)
    await fetch(`${supabaseUrl}/rest/v1/license_audit_log`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        license_id: license.id,
        action: 'license_verified',
        details: { 
          product: product || 'unknown',
          version: version || 'unknown'
        }
      })
    });

    // Return minimal response (no personal data)
    const response_data = {
      status: 'valid',
      license_type: license.license_type,
      expires_at: license.expires_at,
      days_remaining: daysRemaining,
      features: license.features || {},
      verified_at: new Date().toISOString(),
      // NO customer information returned for security
    };

    // Add renewal warning for licenses expiring soon
    if (daysRemaining <= 30) {
      response_data.warnings = [`License expires in ${daysRemaining} days`];
      response_data.renewal_url = `${process.env.PAYMENT_BASE_URL || 'https://your-domain.com'}/payment?mf=${machine_fingerprint}&renewal=true`;
    }

    return res.json(response_data);

  } catch (error) {
    console.error('Secure license verification error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'License verification service temporarily unavailable',
      action: 'retry_later'
    });
  }
}