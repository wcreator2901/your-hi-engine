import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get IP from various headers (Cloudflare, proxies, etc.)
    const cfConnectingIp = req.headers.get('cf-connecting-ip')
    const xForwardedFor = req.headers.get('x-forwarded-for')
    const xRealIp = req.headers.get('x-real-ip')
    
    // Priority: CF-Connecting-IP > X-Forwarded-For (first) > X-Real-IP
    let ip = cfConnectingIp || 
             (xForwardedFor?.split(',')[0].trim()) || 
             xRealIp || 
             'unknown'

    // Get geolocation data
    let geoData = {
      country: null,
      city: null,
      region: null
    }

    // Try to get geo data if we have an IP
    if (ip !== 'unknown') {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`)
        if (geoResponse.ok) {
          const data = await geoResponse.json()
          geoData = {
            country: data.country_name || null,
            city: data.city || null,
            region: data.region || null
          }
        }
      } catch (error) {
        console.log('Could not fetch geo data:', error)
      }
    }

    return new Response(
      JSON.stringify({ 
        ip,
        ...geoData
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in get-client-ip:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})