import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  user_id: string
  asset_symbol: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { user_id, asset_symbol } = await req.json() as RequestBody

    console.log('🔎 Fetching wallet balance', { user_id, asset_symbol })

    const { data, error } = await supabase
      .from('user_wallets')
      .select('id, balance_crypto')
      .eq('user_id', user_id)
      .eq('asset_symbol', asset_symbol)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('❌ Error fetching wallet balance:', error)
      throw error
    }

    const balance_crypto = data?.balance_crypto ?? 0

    return new Response(
      JSON.stringify({ balance_crypto, wallet_id: data?.id ?? null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (e) {
    console.error('❌ get-wallet-balance error:', e)
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})