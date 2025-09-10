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
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const thirtyDaysFromNowISO = thirtyDaysFromNow.toISOString();
    
    // Get all licenses for analysis
    const allLicensesResponse = await fetch(`${supabaseUrl}/rest/v1/licenses?select=*`, {
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
      cancelled_licenses: 0,
      expiring_soon: 0, // expiring within 30 days
      by_type: {
        student: 0,
        startup: 0,
        professional: 0,
        professional_yearly: 0,
        enterprise: 0,
        enterprise_yearly: 0
      },
      revenue_estimate: {
        monthly: 0,
        yearly: 0
      }
    };
    
    const now = new Date();
    const thirtyDaysFromNowDate = new Date(thirtyDaysFromNowISO);
    
    // Price mapping for revenue estimation
    const pricing = {
      student: { monthly: 0, yearly: 49 },
      startup: { monthly: 99, yearly: 0 },
      professional: { monthly: 199, yearly: 0 },
      professional_yearly: { monthly: 0, yearly: 1999 },
      enterprise: { monthly: 499, yearly: 0 },
      enterprise_yearly: { monthly: 0, yearly: 4999 }
    };
    
    allLicenses.forEach(license => {
      const expiresAt = new Date(license.expires_at);
      const isExpired = expiresAt < now;
      const isExpiringSoon = !isExpired && expiresAt <= thirtyDaysFromNowDate;
      
      // Count by status
      if (license.status === 'cancelled') {
        stats.cancelled_licenses++;
      } else if (isExpired) {
        stats.expired_licenses++;
      } else {
        stats.active_licenses++;
        
        // Count expiring soon
        if (isExpiringSoon) {
          stats.expiring_soon++;
        }
        
        // Revenue estimation for active licenses
        const licenseType = license.license_type;
        if (pricing[licenseType]) {
          stats.revenue_estimate.monthly += pricing[licenseType].monthly;
          stats.revenue_estimate.yearly += pricing[licenseType].yearly;
        }
      }
      
      // Count by type
      if (stats.by_type.hasOwnProperty(license.license_type)) {
        stats.by_type[license.license_type]++;
      }
    });
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
    
    const recentLicensesResponse = await fetch(
      `${supabaseUrl}/rest/v1/licenses?created_at=gte.${thirtyDaysAgoISO}&select=created_at,license_type&order=created_at.desc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const recentLicenses = await recentLicensesResponse.json();
    
    // Get audit log for recent activity
    const auditResponse = await fetch(
      `${supabaseUrl}/rest/v1/license_audit_log?created_at=gte.${thirtyDaysAgoISO}&select=*&order=created_at.desc&limit=50`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const auditLog = await auditResponse.json();
    
    return res.json({
      success: true,
      stats,
      recent_activity: {
        new_licenses_30_days: recentLicenses.length,
        recent_licenses: recentLicenses.slice(0, 10),
        recent_audit_events: auditLog.slice(0, 20)
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}