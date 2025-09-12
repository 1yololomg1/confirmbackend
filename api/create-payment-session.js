// Create Stripe payment session with machine fingerprint
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { machine_fingerprint, license_type, is_renewal } = req.body;

    if (!machine_fingerprint || !license_type) {
      return res.status(400).json({
        error: 'Machine fingerprint and license type required'
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Define pricing (in cents)
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
      return res.status(400).json({
        error: 'Invalid license type'
      });
    }

    // Create Stripe checkout session
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
      // Minimal data collection for oil & gas security requirements
      customer_creation: 'never', // Don't create customer records
      billing_address_collection: 'required', // Required for tax purposes only
      shipping_address_collection: null, // No shipping needed
    });

    return res.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id
    });

  } catch (error) {
    console.error('Payment session creation error:', error);
    return res.status(500).json({
      error: 'Failed to create payment session',
      message: error.message
    });
  }
}