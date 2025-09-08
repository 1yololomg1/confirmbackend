// api/webhooks/stripe.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify webhook signature
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase, stripe);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabase, stripe);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object, supabase);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutCompleted(session, supabase, stripe) {
  console.log('Processing checkout completion:', session.id);

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const customer = await stripe.customers.retrieve(session.customer);
  
  // Get plan details
  const priceId = subscription.items.data[0].price.id;
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();

  if (!plan) {
    throw new Error(`Plan not found for price ID: ${priceId}`);
  }

  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + plan.duration_months);

  // Extract machine_id from metadata
  const machineId = session.metadata?.machine_id;
  if (!machineId) {
    throw new Error('Machine ID not found in checkout session');
  }

  // Create license
  const { error } = await supabase
    .from('licenses')
    .insert({
      machine_id: machineId,
      customer_name: customer.name || session.customer_details?.name,
      customer_email: customer.email || session.customer_details?.email,
      license_type: plan.plan_name,
      status: 'active',
      features: plan.features,
      expires_at: expiryDate.toISOString(),
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      stripe_price_id: priceId,
      last_payment_date: new Date().toISOString(),
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString()
    });

  if (error) {
    throw new Error(`Failed to create license: ${error.message}`);
  }

  console.log(`License created for machine: ${machineId}, plan: ${plan.plan_name}`);
}

async function handlePaymentSucceeded(invoice, supabase, stripe) {
  // Renew existing license
  const subscriptionId = invoice.subscription;
  
  const { data: license, error: fetchError } = await supabase
    .from('licenses')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (fetchError || !license) {
    console.log('License not found for renewal:', subscriptionId);
    return;
  }

  // Extend expiry date
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', license.stripe_price_id)
    .single();

  const newExpiryDate = new Date(license.expires_at);
  newExpiryDate.setMonth(newExpiryDate.getMonth() + plan.duration_months);

  const { error } = await supabase
    .from('licenses')
    .update({
      expires_at: newExpiryDate.toISOString(),
      last_payment_date: new Date().toISOString(),
      status: 'active'
    })
    .eq('id', license.id);

  if (error) {
    throw new Error(`Failed to renew license: ${error.message}`);
  }

  console.log(`License renewed for machine: ${license.machine_id}`);
}

async function handleSubscriptionCancelled(subscription, supabase) {
  const { error } = await supabase
    .from('licenses')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    throw new Error(`Failed to cancel license: ${error.message}`);
  }

  console.log(`License cancelled for subscription: ${subscription.id}`);
}

async function handlePaymentFailed(invoice, supabase) {
  const subscriptionId = invoice.subscription;
  
  const { error } = await supabase
    .from('licenses')
    .update({ status: 'suspended' })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    throw new Error(`Failed to suspend license: ${error.message}`);
  }

  console.log(`License suspended for failed payment: ${subscriptionId}`);
}
