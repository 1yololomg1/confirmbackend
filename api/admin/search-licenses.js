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
    
    const { search, type, status } = req.body;
    
    // Build query parameters
    let queryParams = [];
    
    // Add search filter (search in customer_name, customer_email, machine_id)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      queryParams.push(`or=(customer_name.ilike.*${searchTerm}*,customer_email.ilike.*${searchTerm}*,machine_id.ilike.*${searchTerm}*)`);
    }
    
    // Add license type filter
    if (type && type.trim()) {
      queryParams.push(`license_type=eq.${type}`);
    }
    
    // Add status filter
    if (status && status.trim()) {
      if (status === 'expired') {
        // For expired, we need to check both status and expiration date
        const currentDate = new Date().toISOString();
        queryParams.push(`or=(status=eq.expired,and(status=eq.active,expires_at=lt.${currentDate}))`);
      } else {
        queryParams.push(`status=eq.${status}`);
      }
    }
    
    // Build final query URL
    let queryUrl = `${supabaseUrl}/rest/v1/licenses?select=*&order=created_at.desc&limit=100`;
    if (queryParams.length > 0) {
      queryUrl += '&' + queryParams.join('&');
    }
    
    console.log('Search query URL:', queryUrl);
    
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
    console.error('Search licenses error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}