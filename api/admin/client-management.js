export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    switch (req.method) {
      case 'GET':
        return await getClients(supabaseUrl, supabaseKey, req, res);
      case 'POST':
        return await createOrUpdateClient(supabaseUrl, supabaseKey, req, res);
      case 'PUT':
        return await createOrUpdateClient(supabaseUrl, supabaseKey, req, res);
      case 'DELETE':
        return await deleteClient(supabaseUrl, supabaseKey, req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Client management error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

async function getClients(supabaseUrl, supabaseKey, req, res) {
  const { search, license_type, status } = req.query;
  
  // Build query for clients based on their licenses
  let queryParams = ['select=customer_email,customer_name,organization,license_type,status,expires_at,created_at,last_verified_at'];
  
  if (search) {
    queryParams.push(`or=(customer_name.ilike.*${search}*,customer_email.ilike.*${search}*,organization.ilike.*${search}*)`);
  }
  
  if (license_type) {
    queryParams.push(`license_type=eq.${license_type}`);
  }
  
  if (status) {
    queryParams.push(`status=eq.${status}`);
  }
  
  const queryUrl = `${supabaseUrl}/rest/v1/licenses?${queryParams.join('&')}&order=created_at.desc`;
  
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
  
  // Group by customer email to create client profiles
  const clientMap = new Map();
  
  licenses.forEach(license => {
    const email = license.customer_email;
    if (!clientMap.has(email)) {
      clientMap.set(email, {
        customer_email: email,
        customer_name: license.customer_name,
        organization: license.organization,
        licenses: [],
        total_licenses: 0,
        active_licenses: 0,
        expired_licenses: 0,
        first_license_date: license.created_at,
        last_activity: license.last_verified_at,
        total_revenue: 0
      });
    }
    
    const client = clientMap.get(email);
    client.licenses.push(license);
    client.total_licenses++;
    
    if (license.status === 'active') {
      client.active_licenses++;
    } else {
      client.expired_licenses++;
    }
    
    // Update dates
    if (license.created_at < client.first_license_date) {
      client.first_license_date = license.created_at;
    }
    
    if (license.last_verified_at && (!client.last_activity || license.last_verified_at > client.last_activity)) {
      client.last_activity = license.last_verified_at;
    }
    
    // Estimate revenue (simplified)
    const pricing = {
      student: 49,
      startup: 99 * 12,
      professional: 199 * 12,
      professional_yearly: 1999,
      enterprise: 499 * 12,
      enterprise_yearly: 4999
    };
    
    if (pricing[license.license_type]) {
      client.total_revenue += pricing[license.license_type];
    }
  });
  
  const clients = Array.from(clientMap.values());
  
  return res.json({
    success: true,
    clients,
    total_clients: clients.length
  });
}

async function createOrUpdateClient(supabaseUrl, supabaseKey, req, res) {
  const { customer_email, customer_name, organization, notes, tags } = req.body;
  
  if (!customer_email) {
    return res.status(400).json({ error: 'Customer email is required' });
  }
  
  // For now, we'll update the licenses table since we don't have a separate clients table
  // In a production system, you'd want a dedicated clients table
  
  const updateData = {};
  if (customer_name) updateData.customer_name = customer_name;
  if (organization) updateData.organization = organization;
  
  if (Object.keys(updateData).length > 0) {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/licenses?customer_email=eq.${customer_email}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Database error: ${response.status}`);
    }
  }
  
  return res.json({
    success: true,
    message: 'Client information updated successfully'
  });
}

async function deleteClient(supabaseUrl, supabaseKey, req, res) {
  const { customer_email } = req.body;
  
  if (!customer_email) {
    return res.status(400).json({ error: 'Customer email is required' });
  }
  
  // This would revoke all licenses for the client
  const response = await fetch(
    `${supabaseUrl}/rest/v1/licenses?customer_email=eq.${customer_email}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Database error: ${response.status}`);
  }
  
  return res.json({
    success: true,
    message: 'All client licenses have been revoked'
  });
}