export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { 
    machine_id, 
    customer_email, 
    customer_name, 
    organization,
    license_type, 
    expires_at,
    features,
    notes 
  } = req.body;

  if (!machine_id || !license_type || !expires_at) {
    return res.status(400).json({ 
      error: 'Missing required fields: machine_id, license_type, expires_at' 
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check if machine already has an active license
    const existingResponse = await fetch(
      `${supabaseUrl}/rest/v1/licenses?machine_id=eq.${machine_id}&status=eq.active&select=id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const existingLicenses = await existingResponse.json();
    if (existingLicenses && existingLicenses.length > 0) {
      return res.status(400).json({ 
        error: 'Machine already has an active license' 
      });
    }

    // Get plan features if not provided - use our feature definition system
    let licenseFeatures = features;
    if (!licenseFeatures) {
      // Import the feature definitions
      const { getFeaturesForLicenseType } = await import('./license-features.js');
      const featureDefinition = getFeaturesForLicenseType(license_type);
      licenseFeatures = featureDefinition ? featureDefinition.features : {};
    }

    // Create the license
    const response = await fetch(`${supabaseUrl}/rest/v1/licenses`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        machine_id,
        customer_email,
        customer_name,
        organization,
        license_type,
        expires_at,
        features: licenseFeatures || {},
        status: 'active',
        paid: true,
        notes: notes || null,
        created_by: 'admin_manual',
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Database error: ${errorText}`);
    }

    const newLicense = await response.json();

    // Log audit event
    await fetch(`${supabaseUrl}/rest/v1/license_audit_log`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        license_id: newLicense[0].id,
        action: 'create_manual_license',
        details: { admin_created: true, license_type, expires_at }
      })
    });

    return res.json({
      success: true,
      license: newLicense[0],
      message: 'License created successfully'
    });

  } catch (error) {
    console.error('Create license error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
