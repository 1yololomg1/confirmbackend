// api/verify-license.js
// License verification endpoint for deltaV Solutions

export default function handler(req, res) {
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

    // PRODUCTION LICENSE VALIDATION
    // Add your actual license validation logic here
    // This could involve:
    // - Database lookup
    // - License server API call
    // - Cryptographic verification
    // - etc.

    // For now, implement a simple whitelist system
    // You can replace this with your actual license database
    const validLicenses = {
      // Add real machine IDs and their license info here
      // Format: 'machine_id': { license_data }
      
      // Example entries (replace with real data):
      'your_customer_machine_id_1': {
        status: 'valid',
        license_type: 'professional',
        expires: '2025-12-31',
        customer_name: 'Customer Name',
        features: ['statistical_analysis', 'multi_sheet', 'export']
      },
      'your_customer_machine_id_2': {
        status: 'valid',
        license_type: 'enterprise',
        expires: '2026-06-30',
        customer_name: 'Enterprise Customer',
        features: ['statistical_analysis', 'multi_sheet', 'export', 'api_access']
      }
    };

    // Check if machine ID has a valid license
    const licenseInfo = validLicenses[machine_id];
    
    if (licenseInfo && licenseInfo.status === 'valid') {
      // Check if license is expired
      const expiryDate = new Date(licenseInfo.expires);
      const now = new Date();
      
      if (expiryDate < now) {
        return res.json({
          status: 'invalid',
          message: 'License expired',
          expired_on: licenseInfo.expires,
          buy_url: 'https://www.deltavsolutions.com/renew'
        });
      }

      // Valid license
      return res.json({
        status: 'valid',
        license_type: licenseInfo.license_type,
        expires: licenseInfo.expires,
        features: licenseInfo.features || [],
        customer_name: licenseInfo.customer_name
      });
    }

    // License not found
    return res.json({
      status: 'invalid',
      message: 'License not found for this machine',
      buy_url: 'https://www.deltavsolutions.com/purchase'
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
