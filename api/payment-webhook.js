// Webhook for automatic license creation after payment
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Extract machine fingerprint and license type from metadata
      const machine_fingerprint = session.metadata.machine_fingerprint;
      const license_type = session.metadata.license_type;
      const amount_paid = session.amount_total / 100; // Convert from cents
      
      if (!machine_fingerprint || !license_type) {
        console.error('Missing required metadata in payment session');
        return res.status(400).json({ error: 'Invalid payment session' });
      }

      // Calculate expiration based on payment tier
      const expirationDate = calculateExpiration(license_type);
      
      // Create license with minimal data
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      const licenseData = {
        machine_fingerprint, // Using fingerprint instead of machine_id
        license_type,
        expires_at: expirationDate,
        amount_paid,
        status: 'active',
        created_by: 'payment_webhook',
        // NO customer email, name, or organization stored
        // NO personal information retained
        features: getAllFeatures() // Everyone gets full features
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/secure_licenses`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(licenseData)
      });

      if (!response.ok) {
        throw new Error(`Database error: ${response.status}`);
      }

      const newLicense = await response.json();

      // Log minimal audit event (no personal data)
      await fetch(`${supabaseUrl}/rest/v1/license_audit_log`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          license_id: newLicense[0].id,
          action: 'license_created_via_payment',
          details: { 
            license_type, 
            amount_paid,
            payment_session_id: session.id
          }
        })
      });

      console.log(`License created for payment: ${session.id}`);
      return res.json({ success: true });
    }

    return res.json({ received: true });

  } catch (error) {
    console.error('Payment webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

function calculateExpiration(licenseType) {
  const now = new Date();
  
  switch (licenseType) {
    case 'student':
      now.setFullYear(now.getFullYear() + 1); // 1 year
      break;
    case 'startup':
      now.setMonth(now.getMonth() + 1); // 1 month
      break;
    case 'professional':
      now.setMonth(now.getMonth() + 1); // 1 month
      break;
    case 'professional_yearly':
      now.setFullYear(now.getFullYear() + 1); // 1 year
      break;
    case 'enterprise':
      now.setMonth(now.getMonth() + 1); // 1 month
      break;
    case 'enterprise_yearly':
      now.setFullYear(now.getFullYear() + 1); // 1 year
      break;
    default:
      now.setMonth(now.getMonth() + 1); // Default 1 month
  }
  
  return now.toISOString();
}

function getAllFeatures() {
  // Everyone gets full features regardless of payment tier
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