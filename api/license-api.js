// Consolidated License Management API - All endpoints in one function
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract endpoint from URL
  const { endpoint } = req.query;
  
  try {
    switch (endpoint) {
      case 'machine-fingerprint':
        return await handleMachineFingerprint(req, res);
      case 'verify-secure-license':
        return await handleVerifySecureLicense(req, res);
      case 'create-payment-session':
        return await handleCreatePaymentSession(req, res);
      case 'admin-analytics':
        return await handleAdminAnalytics(req, res);
      case 'admin-licenses':
        return await handleAdminLicenses(req, res);
      case 'admin-create-license':
        return await handleAdminCreateLicense(req, res);
      case 'admin-revoke-license':
        return await handleAdminRevokeLicense(req, res);
      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

// Machine Fingerprint Generation
async function handleMachineFingerprint(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { hardware_info } = req.body;
  
  if (!hardware_info || !hardware_info.cpu_id || !hardware_info.motherboard_id) {
    return res.status(400).json({
      error: 'Hardware information required',
      required: ['cpu_id', 'motherboard_id']
    });
  }

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

  const payment_url = `${process.env.PAYMENT_BASE_URL || 'https://your-domain.com'}/payment?mf=${machine_fingerprint}`;

  return res.json({
    success: true,
    machine_fingerprint,
    payment_url,
    message: 'Machine fingerprint generated successfully'
  });
}

// Secure License Verification
async function handleVerifySecureLicense(req, res) {
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

  // Recreate machine fingerprint
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

  // Query for active, non-expired license
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
    // Check for expired license
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

  // Update verification tracking
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
      action: 'license_verified',
      details: { product: product || 'unknown', version: version || 'unknown' }
    })
  });

  const response_data = {
    status: 'valid',
    license_type: license.license_type,
    expires_at: license.expires_at,
    days_remaining: daysRemaining,
    features: license.features || {},
    verified_at: new Date().toISOString()
  };

  if (daysRemaining <= 30) {
    response_data.warnings = [`License expires in ${daysRemaining} days`];
    response_data.renewal_url = `${process.env.PAYMENT_BASE_URL || 'https://your-domain.com'}/payment?mf=${machine_fingerprint}&renewal=true`;
  }

  return res.json(response_data);
}

// Create Payment Session
async function handleCreatePaymentSession(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { machine_fingerprint, license_type, is_renewal } = req.body;

  if (!machine_fingerprint || !license_type) {
    return res.status(400).json({
      error: 'Machine fingerprint and license type required'
    });
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  const pricing = {
    student: { amount: 4900, name: 'Student License', interval: 'year' },
    startup: { amount: 9900, name: 'Startup License', interval: 'month' },
    professional: { amount: 19900, name: 'Professional License', interval: 'month' },
    professional_yearly: { amount: 199900, name: 'Professional License (Yearly)', interval: 'year' },
    enterprise: { amount: 49900, name: 'Enterprise License', interval: 'month' },
    enterprise_yearly: { amount: 499900, name: 'Enterprise License (Yearly)', interval: 'year' }
  };

  const priceInfo = pricing[license_type];
  if (!priceInfo) {
    return res.status(400).json({ error: 'Invalid license type' });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${priceInfo.name} - Oil & Gas Industry Software`,
          description: 'Full features included - All license tiers have identical capabilities',
        },
        unit_amount: priceInfo.amount,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.PAYMENT_BASE_URL || 'https://your-domain.com'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.PAYMENT_BASE_URL || 'https://your-domain.com'}/payment-cancelled`,
    metadata: {
      machine_fingerprint,
      license_type,
      is_renewal: is_renewal ? 'true' : 'false'
    },
    customer_creation: 'never',
    billing_address_collection: 'required',
    shipping_address_collection: null,
  });

  return res.json({
    success: true,
    checkout_url: session.url,
    session_id: session.id
  });
}

// Admin Analytics
async function handleAdminAnalytics(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
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
  
  const stats = {
    total_licenses: allLicenses.length,
    active_licenses: 0,
    expired_licenses: 0,
    total_revenue: 0,
    by_type: {
      student: 0, startup: 0, professional: 0,
      professional_yearly: 0, enterprise: 0, enterprise_yearly: 0
    }
  };
  
  const now = new Date();
  
  allLicenses.forEach(license => {
    const expiresAt = new Date(license.expires_at);
    const isExpired = expiresAt < now;
    
    if (isExpired || license.status === 'expired') {
      stats.expired_licenses++;
    } else if (license.status === 'active') {
      stats.active_licenses++;
    }
    
    if (stats.by_type.hasOwnProperty(license.license_type)) {
      stats.by_type[license.license_type]++;
    }
    
    if (license.amount_paid) {
      stats.total_revenue += license.amount_paid;
    }
  });
  
  return res.json({
    success: true,
    stats,
    generated_at: new Date().toISOString()
  });
}

// Admin Licenses
async function handleAdminLicenses(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const { fingerprint_search } = req.body;
  
  let queryUrl = `${supabaseUrl}/rest/v1/secure_licenses?select=machine_fingerprint,license_type,status,expires_at,last_verified_at,created_at&order=created_at.desc&limit=100`;
  
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
    throw new Error(`Database error: ${response.status}`);
  }

  const licenses = await response.json();
  
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
}

// Admin Create License (Manual)
async function handleAdminCreateLicense(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { machine_fingerprint, license_type, expires_at, notes } = req.body;

  if (!machine_fingerprint || !license_type || !expires_at) {
    return res.status(400).json({ 
      error: 'Missing required fields: machine_fingerprint, license_type, expires_at' 
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check if machine already has an active license
  const existingResponse = await fetch(
    `${supabaseUrl}/rest/v1/secure_licenses?machine_fingerprint=eq.${machine_fingerprint}&status=eq.active&select=id`,
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

  // Get full features for any license type
  const features = getAllFeatures();

  const response = await fetch(`${supabaseUrl}/rest/v1/secure_licenses`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      machine_fingerprint,
      license_type,
      expires_at,
      features,
      status: 'active',
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
}

// Admin Revoke License
async function handleAdminRevokeLicense(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { machine_fingerprint, reason } = req.body;

  if (!machine_fingerprint) {
    return res.status(400).json({ error: 'Machine fingerprint required' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/secure_licenses?machine_fingerprint=eq.${machine_fingerprint}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
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

  const updatedLicense = await response.json();

  return res.json({
    success: true,
    message: 'License revoked successfully',
    license: updatedLicense[0]
  });
}

// Helper function to get all features
function getAllFeatures() {
  return {
    basic_analysis: true,
    advanced_analysis: true,
    premium_analysis: true,
    enterprise_analysis: true,
    report_generation: true,
    email_support: true,
    priority_support: true,
    phone_support: true,
    max_projects: -1,
    max_users: -1,
    api_access: "full",
    advanced_analytics: true,
    custom_integrations: true,
    sla_guarantee: true,
    commercial_use: true,
    watermarked_reports: false,
    export_formats: ["PDF", "Excel", "CSV", "JSON", "XML", "PowerBI", "Tableau"],
    data_retention_days: -1,
    team_collaboration: true,
    api_calls: -1,
    white_label_reports: true,
    advanced_permissions: true,
    audit_logging: true,
    dedicated_account_manager: true,
    custom_deployment: true,
    sso_integration: true,
    ldap_integration: true,
    custom_branding: true,
    advanced_security: true,
    compliance_reports: true,
    data_residency: true,
    custom_training: true
  };
}