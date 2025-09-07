// api/create-checkout.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { plan_type, machine_id, success_url, cancel_url } = req.body;

    // Get plan details
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_name', plan_type)
      .eq('active', true)
      .single();

    if (error || !plan) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: plan.stripe_price_id,
        quantity: 1,
      }],
      metadata: {
        machine_id: machine_id,
        plan_type: plan_type
      },
      success_url: success_url,
      cancel_url: cancel_url,
      automatic_tax: { enabled: true },
    });

    return res.json({ checkout_url: session.url });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
