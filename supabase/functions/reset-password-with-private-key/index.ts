import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  record.count++;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    console.log(`Password reset attempt from IP: ${clientIP}`);

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many password reset attempts. Please try again later.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { email, privateKey, newPassword } = await req.json();

    // Validate inputs
    if (!email || !privateKey || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (privateKey.length !== 12) {
      return new Response(
        JSON.stringify({ error: 'Invalid private key format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`Looking up user with email: ${email}`);

    // Find user by email
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (profileError || !userProfile) {
      console.log('User not found');
      // Log failed attempt
      await supabaseClient.from('security_logs').insert({
        event_type: 'password_reset_key',
        ip_address: clientIP,
        severity: 'high',
        metadata: { success: false, error: 'User not found', email }
      });

      return new Response(
        JSON.stringify({ error: 'Invalid email or private key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userProfile.user_id;
    console.log(`Found user: ${userId}`);

    // Fetch stored private key
    const { data: keyData, error: keyError } = await supabaseClient
      .from('user_private_keys')
      .select('private_key')
      .eq('user_id', userId)
      .maybeSingle();

    if (keyError || !keyData) {
      console.log('Private key not found for user');
      await supabaseClient.from('security_logs').insert({
        event_type: 'password_reset_key',
        user_id: userId,
        ip_address: clientIP,
        severity: 'high',
        metadata: { success: false, error: 'No private key found' }
      });

      return new Response(
        JSON.stringify({ error: 'Invalid email or private key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify private key matches
    if (keyData.private_key !== privateKey) {
      console.log('Private key mismatch');
      await supabaseClient.from('security_logs').insert({
        event_type: 'password_reset_key',
        user_id: userId,
        ip_address: clientIP,
        severity: 'high',
        metadata: { success: false, error: 'Invalid private key' }
      });

      return new Response(
        JSON.stringify({ error: 'Invalid email or private key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Private key verified, updating password...');

    // Update user password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update failed:', updateError);
      await supabaseClient.from('security_logs').insert({
        event_type: 'password_reset_key',
        user_id: userId,
        ip_address: clientIP,
        severity: 'high',
        metadata: { success: false, error: updateError.message }
      });

      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password updated successfully');

    // Log successful password reset
    await supabaseClient.from('security_logs').insert({
      event_type: 'password_reset_key',
      user_id: userId,
      ip_address: clientIP,
      severity: 'high',
      metadata: { success: true }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password has been reset successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
