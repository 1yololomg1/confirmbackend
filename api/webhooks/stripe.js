export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    const buf = await buffer(req);
    const event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, stripe, supabaseUrl, supabaseKey);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, stripe, supabaseUrl, supabaseKey);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object, supabaseUrl, supabaseKey);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabaseUrl, supabaseKey);
        break;
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function handleCheckoutCompleted(session, stripe, supabaseUrl, supabaseKey) {
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const customer = await stripe.customers.retrieve(session.customer);
  
  const machineId = session.metadata?.machine_id;
  if (!machineId) {
    throw new Error('Machine ID not found in checkout session');
  }

  // Get plan details
  const priceId = subscription.items.data[0].price.id;
  const planResponse = await fetch(
    `${supabaseUrl}/rest/v1/subscription_plans?stripe_price_id=eq.${priceId}&select=*`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );
  const plans = await planResponse.json();
  const plan = plans[0];

  if (!plan) {
    throw new Error(`Plan not found for price ID: ${priceId}`);
  }

  // Calculate expiry
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + plan.duration_months);

  // Create license
  const licenseResponse = await fetch(`${supabaseUrl}/rest/v1/licenses`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      machine_id: machineId,
      customer_name: customer.name || session.customer_details?.name,
      customer_email: customer.email || session.customer_details?.email,
      license_type: plan.plan_name,
      status: 'active',
      features: plan.features || {},
      expires_at: expiryDate.toISOString(),
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      paid: true
    })
  });

  if (!licenseResponse.ok) {
    throw new Error(`Failed to create license: ${await licenseResponse.text()}`);
  }

  const newLicense = await licenseResponse.json();
  console.log(`License created for machine: ${machineId}, plan: ${plan.plan_name}`);
}

async function handlePaymentSucceeded(invoice, stripe, supabaseUrl, supabaseKey) {
  const subscriptionId = invoice.subscription;
  
  // Find license by subscription ID
  const licenseResponse = await fetch(
    `${supabaseUrl}/rest/v1/licenses?stripe_subscription_id=eq.${subscriptionId}&select=*`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );
  
  const licenses = await licenseResponse.json();
  if (!licenses || licenses.length === 0) {
    console.log('License not found for renewal:', subscriptionId);
    return;
  }

  const license = licenses[0];
  
  // Get plan details for renewal period
  const planResponse = await fetch(
    `${supabaseUrl}/rest/v1/subscription_plans?plan_name=eq.${license.license_type}&select=*`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );
  const plans = await planResponse.json();
  const plan = plans[0];

  if (plan) {
    // Extend expiry date
    const currentExpiry = new Date(license.expires_at);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + plan.duration_months);

    await fetch(`${supabaseUrl}/rest/v1/licenses?id=eq.${license.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expires_at: newExpiry.toISOString(),
        status: 'active',
        updated_at: new Date().toISOString()
      })
    });

    console.log(`License renewed for machine: ${license.machine_id}`);
  }
}

async function handleSubscriptionCancelled(subscription, supabaseUrl, supabaseKey) {
  await fetch(`${supabaseUrl}/rest/v1/licenses?stripe_subscription_id=eq.${subscription.id}`, {
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
  });

  console.log(`License cancelled for subscription: ${subscription.id}`);
}

async function handlePaymentFailed(invoice, supabaseUrl, supabaseKey) {
  const subscriptionId = invoice.subscription;
  
  await fetch(`${supabaseUrl}/rest/v1/licenses?stripe_subscription_id=eq.${subscriptionId}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'suspended',
      updated_at: new Date().toISOString()
    })
  });

  console.log(`License suspended for failed payment: ${subscriptionId}`);
}
