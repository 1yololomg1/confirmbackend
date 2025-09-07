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

    const { machine_id, reason } = req.body;

    if (!machine_id) {
      return res.status(400).json({ error: 'Machine ID required' });
    }

    const { data, error } = await supabase
      .from('licenses')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('machine_id', machine_id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({
      success: true,
      message: 'License revoked successfully',
      license: data
    });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
