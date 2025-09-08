// api/admin/create-license.js
// Properly aligned with your actual table structure

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

  try {
    // Verify admin authentication
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { machine_id, customer_email, license_key } = req.body;

    // Validate required fields for your actual table
    if (!machine_id) {
      return res.status(400).json({ error: 'machine_id is required' });
    }

    if (!license_key) {
      return res.status(400).json({ error: 'license_key is required' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Insert using your actual table structure
    const response = await fetch(`${supabaseUrl}/rest/v1/licenses`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        machine_id: machine_id,
        license_key: license_key,
        paid: true,
        customer_email: customer_email || null,
        email: customer_email || null,
        verification_count: 0,
        last_verified_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase insert failed:', response.status, errorText);
      return res.status(500).json({ 
        error: 'Failed to create license',
        details: errorText 
      });
    }

    const newLicense = await response.json();

    return res.json({
      success: true,
      license: newLicense[0],
      message: 'License created successfully'
    });

  } catch (error) {
    console.error('Admin create license error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
