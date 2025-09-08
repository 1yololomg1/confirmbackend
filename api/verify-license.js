// Temporary debug version to see what env vars are available
export default async function handler(req, res) {
  try {
    // Log all Supabase-related environment variables
    console.log('Environment variables check:');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    
    // List all env vars that contain 'SUPABASE'
    const supabaseVars = Object.keys(process.env).filter(key => key.includes('SUPABASE'));
    console.log('All Supabase env vars:', supabaseVars);
    
    return res.json({
      status: 'debug',
      message: 'Check Vercel logs for environment variable info',
      supabaseVars: supabaseVars
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({ error: 'Debug failed' });
  }
}
