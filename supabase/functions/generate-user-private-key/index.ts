import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  for (let i = 0; i < 12; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate auth and get current user
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate a simple 12-character recovery code
    const recoveryCode = generateRecoveryCode();
    console.log('✅ Generated recovery code for user:', user.id);

    // Upsert or update existing record safely without relying on unique constraints
    const { data: existing, error: fetchErr } = await supabase
      .from('user_private_keys')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchErr && fetchErr.message && !fetchErr.message.includes('No rows')) {
      throw fetchErr;
    }

    if (existing?.id) {
      const { error: updateErr } = await supabase
        .from('user_private_keys')
        .update({ private_key: recoveryCode })
        .eq('id', existing.id);
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from('user_private_keys')
        .insert({ user_id: user.id, private_key: recoveryCode });
      if (insertErr) throw insertErr;
    }

    return new Response(JSON.stringify({ success: true, privateKey: recoveryCode }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in generate-user-private-key:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
