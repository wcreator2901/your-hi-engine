import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BinancePriceResponse { symbol: string; price: string }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const fetchBinancePrice = async (symbol: string, retries = 3): Promise<number | null> => {
  const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Binance error ${res.status}`)
      const data = (await res.json()) as BinancePriceResponse
      return parseFloat(data.price)
    } catch (error) {
      console.warn(`[WARN] Attempt ${attempt}/${retries} failed for ${symbol}:`, error)
      if (attempt < retries) await sleep(500 * attempt)
    }
  }
  return null // Return null if all retries fail
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    )

    console.log('[INFO] Fetching live prices from Binance...')

    // Fetch ETH and BTC with retry logic
    const [eth, btc] = await Promise.all([
      fetchBinancePrice('ETHUSDT'),
      fetchBinancePrice('BTCUSDT'),
    ])

    // If both failed, try to return cached prices
    if (eth === null && btc === null) {
      console.warn('[WARN] All Binance fetches failed, returning cached prices')
      const { data: cached } = await supabase.from('crypto_prices').select('*')
      if (cached && cached.length > 0) {
        const cachedPrices = Object.fromEntries(cached.map(c => [c.id, c.price]))
        return new Response(JSON.stringify({ prices: cachedPrices, cached: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      throw new Error('Unable to fetch prices and no cache available')
    }

    // Use fetched prices or fallback to previous values
    let finalEth = eth
    let finalBtc = btc

    if (eth === null || btc === null) {
      const { data: cached } = await supabase.from('crypto_prices').select('*')
      const cachedMap = cached ? Object.fromEntries(cached.map(c => [c.id, c.price])) : {}
      if (eth === null) finalEth = cachedMap['ethereum'] || 0
      if (btc === null) finalBtc = cachedMap['bitcoin'] || 0
    }

    const prices = {
      ethereum: finalEth,
      bitcoin: finalBtc,
      'tether-erc20': 1.0,
      'usdt-erc20': 1.0,
      'usdt_tron': 1.0,
      'usd-coin': 1.0,
      'usdc-erc20': 1.0,
    }

    console.log('[INFO] Upserting prices into crypto_prices table...')

    const rows = Object.entries(prices).map(([id, price]) => ({ id, price, updated_at: new Date().toISOString() }))

    const { error } = await supabase.from('crypto_prices').upsert(rows)
    if (error) {
      console.error('[ERROR] Supabase upsert error:', error)
      throw error
    }

    console.log('[SUCCESS] Prices updated')

    return new Response(JSON.stringify({ prices }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    console.error('[ERROR] update-crypto-prices error:', e)
    const message = e instanceof Error ? e.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
