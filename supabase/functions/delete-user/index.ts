import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('🔵 Delete user function called');

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(JSON.stringify({ error: 'Missing auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service client for privileged ops
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');

    // Validate current user using provided JWT
    const { data: { user }, error: getUserErr } = await supabaseService.auth.getUser(token);
    if (getUserErr || !user) {
      console.error('❌ Auth error:', getUserErr);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentUserId = user.id;
    console.log('✅ Authenticated user:', currentUserId);

    // Verify admin using SECURITY DEFINER function (bypasses recursive RLS)
    const { data: isAdmin, error: adminErr } = await supabaseService
      .rpc('check_user_is_admin', { check_user_id: currentUserId });

    if (adminErr) {
      console.error('❌ Admin check error:', adminErr);
      return new Response(JSON.stringify({ error: 'Admin check failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isAdmin) {
      console.error('❌ User is not an admin');
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse payload
    const { userId } = await req.json();
    if (!userId) {
      console.error('❌ No userId in request');
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🗑️ Deleting user:', userId);

    // Try to delete from auth (may not exist if orphaned)
    const { error: deleteError } = await supabaseService.auth.admin.deleteUser(userId);
    if (deleteError && deleteError.message !== 'User not found') {
      console.error('❌ Delete error:', deleteError);
      return new Response(JSON.stringify({ error: deleteError.message || 'Delete failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (deleteError?.message === 'User not found') {
      console.log('⚠️ User not found in auth, cleaning up orphaned data...');
    }

    // Clean up related data (for orphaned profiles or cascaded deletions)
    const tables = [
      'user_profiles',
      'user_wallets', 
      'user_seed_phrases',
      'user_private_keys',
      'user_transactions',
      'user_staking',
      'user_2fa',
      'deposit_addresses',
      'default_crypto_addresses',
      'kyc_submissions',
      'bank_accounts'
    ];

    for (const table of tables) {
      const { error: cleanupError } = await supabaseService
        .from(table)
        .delete()
        .eq('user_id', userId);
      
      if (cleanupError) {
        console.log(`⚠️ Cleanup warning for ${table}:`, cleanupError.message);
      }
    }

    console.log('✅ User and related data deleted successfully:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
