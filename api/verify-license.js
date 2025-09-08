// api/verify-license.js
// License verification endpoint for deltaV Solutions

export default async function handler(req, res) {
  try {
    // Use require instead of import
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Rest of your code...

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    const { machine_id, product, version } = req.body;

    // Validate required fields
    if (!machine_id) {
      return res.status(400).json({
        status: 'invalid',
        message: 'Missing machine_id',
        buy_url: 'https://www.deltavsolutions.com/purchase'
      });
    }

    // Log the request for debugging (remove in production)
    console.log('License check request:', {
      machine_id: machine_id?.substring(0, 8) + '...',
      product,
      version,
      timestamp: new Date().toISOString()
    });

    // FOR DEVELOPMENT: Allow specific test machine IDs
    const devMachineIds = [
      'test123',
      'development',
      'debug'
    ];

    if (devMachineIds.includes(machine_id)) {
      return res.json({
        status: 'valid',
        license_type: 'development',
        expires: '2025-12-31',
        message: 'Development license'
      });
    }

      // PRODUCTION LICENSE VALIDATION - Query Supabase
    const { createClient } = await import('@supabase/supabase-js');

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        status: 'invalid',
        message: 'Server configuration error',
        buy_url: 'https://www.deltavsolutions.com/support'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query Supabase for the license
    const { data: licenseInfo, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('machine_id', machine_id)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({
        status: 'invalid',
        message: 'Database error',
        buy_url: 'https://www.deltavsolutions.com/support'
      });
    }

    // If no license found
    if (!licenseInfo || error?.code === 'PGRST116') {
      return res.json({
        status: 'invalid',
        message: 'License not found for this machine',
        buy_url: 'https://www.deltavsolutions.com/purchase'
      });
    }
    
    // Check if license is expired
    const expiryDate = new Date(licenseInfo.expires_at || licenseInfo.expires);
    const now = new Date();
    
    if (expiryDate < now) {
      return res.json({
        status: 'invalid',
        message: 'License expired',
        expired_on: licenseInfo.expires_at || licenseInfo.expires,
        buy_url: 'https://www.deltavsolutions.com/renew'
      });
    }

    // Valid license found
    return res.json({
      status: 'valid',
      license_type: licenseInfo.license_type,
      expires: licenseInfo.expires_at || licenseInfo.expires,
      features: licenseInfo.features ? licenseInfo.features.split(',') : [],
      customer_name: licenseInfo.customer_name
    });

  } catch (error) {
    console.error('License verification error:', error);
    
    return res.status(500).json({
      status: 'invalid',
      message: 'Internal server error during license verification',
      buy_url: 'https://www.deltavsolutions.com/support'
    });
  }
}
