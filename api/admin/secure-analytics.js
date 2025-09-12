// Secure analytics with minimal data exposure
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
    
    const currentDate = new Date().toISOString();
    
    // Get all licenses for analysis (no personal data)
    const allLicensesResponse = await fetch(`${supabaseUrl}/rest/v1/secure_licenses?select=license_type,status,expires_at,amount_paid,created_at`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!allLicensesResponse.ok) {
      throw new Error(`Database error: ${allLicensesResponse.status}`);
    }
    
    const allLicenses = await allLicensesResponse.json();
    
    // Calculate statistics
    const stats = {
      total_licenses: allLicenses.length,
      active_licenses: 0,
      expired_licenses: 0,
      total_revenue: 0,
      by_type: {
        student: 0,
        startup: 0,
        professional: 0,
        professional_yearly: 0,
        enterprise: 0,
        enterprise_yearly: 0
      }
    };
    
    const now = new Date();
    
    allLicenses.forEach(license => {
      const expiresAt = new Date(license.expires_at);
      const isExpired = expiresAt < now;
      
      // Count by status
      if (isExpired || license.status === 'expired') {
        stats.expired_licenses++;
      } else if (license.status === 'active') {
        stats.active_licenses++;
      }
      
      // Count by type
      if (stats.by_type.hasOwnProperty(license.license_type)) {
        stats.by_type[license.license_type]++;
      }
      
      // Revenue calculation
      if (license.amount_paid) {
        stats.total_revenue += license.amount_paid;
      }
    });
    
    return res.json({
      success: true,
      stats,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Secure analytics error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}