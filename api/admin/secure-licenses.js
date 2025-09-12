// Secure license management - no personal data exposed
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

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const { fingerprint_search } = req.body;
    
    // Build query - only expose minimal data
    let queryUrl = `${supabaseUrl}/rest/v1/secure_licenses?select=machine_fingerprint,license_type,status,expires_at,last_verified_at,created_at&order=created_at.desc&limit=100`;
    
    // Add fingerprint filter if provided
    if (fingerprint_search && fingerprint_search.trim()) {
      queryUrl += `&machine_fingerprint=ilike.*${fingerprint_search.trim()}*`;
    }
    
    const response = await fetch(queryUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Database error: ${errorText}`);
    }

    const licenses = await response.json();
    
    // Post-process to handle expired status correctly
    const processedLicenses = licenses.map(license => {
      const isExpired = new Date(license.expires_at) < new Date();
      if (isExpired && license.status === 'active') {
        license.status = 'expired';
      }
      return license;
    });

    return res.json({
      success: true,
      licenses: processedLicenses,
      count: processedLicenses.length
    });

  } catch (error) {
    console.error('Secure licenses error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}