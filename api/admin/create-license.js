export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const {
      machine_id,
      customer_name,
      customer_email,
      license_type,
      expires_at,
      features = 'basic_analysis,export_data'
    } = req.body;

    if (!machine_id || !customer_email || !license_type || !expires_at) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('licenses')
      .insert({
        machine_id,
        customer_name,
        customer_email,
        license_type,
        expires_at,
        features,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      success: true,
      license: data
    });

  } catch (error) {
    console.error('Create license error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
