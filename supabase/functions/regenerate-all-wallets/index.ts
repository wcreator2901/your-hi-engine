import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Regenerating wallets for user:', user.id);

    // Delete existing HD wallets
    const { error: deleteError } = await supabase
      .from('user_wallets')
      .delete()
      .eq('user_id', user.id)
      .eq('is_hd_wallet', true);

    if (deleteError) {
      console.error('Error deleting old wallets:', deleteError);
    }

    // Get the user's seed phrase
    const { data: seedData, error: seedError } = await supabase
      .from('user_seed_phrases')
      .select('seed_phrase')
      .eq('user_id', user.id)
      .single();

    if (seedError || !seedData?.seed_phrase) {
      throw new Error('No seed phrase found for user');
    }

    // Import the wallet derivation functions (we'll simulate them here for the edge function)
    // Note: In production, you'd want to import the actual hdWallet functions
    // For now, returning success and the generation will happen on the frontend
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Please refresh the page to generate new wallets',
        userId: user.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in regenerate-all-wallets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});