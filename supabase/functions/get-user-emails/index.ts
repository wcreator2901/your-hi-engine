import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to decode JWT payload without verification
// (We use service role for actual authorization, not the JWT itself)
function decodeJwtPayload(token: string): { sub?: string; email?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing Authorization header')
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Decode JWT to get user ID (we'll verify admin status with service role)
    const payload = decodeJwtPayload(token)
    
    if (!payload?.sub) {
      console.error('Invalid JWT: no user ID found')
      throw new Error('Invalid token format')
    }

    const userId = payload.sub
    console.log('User ID from JWT:', userId)
    
    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if user is admin using service role (bypasses session requirement)
    const { data: isAdmin, error: adminError } = await supabaseAdmin
      .rpc('check_user_is_admin', { check_user_id: userId })

    if (adminError) {
      console.error('Admin check RPC error:', adminError)
      throw new Error(`Failed to verify admin status: ${adminError.message}`)
    }

    if (!isAdmin) {
      console.log('User is not an admin:', userId)
      throw new Error('Admin access required. Your account does not have admin privileges.')
    }

    console.log('Admin verified:', userId)

    // Get all users with their emails using service role
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      throw usersError
    }

    const userEmails = users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at
    }))

    return new Response(
      JSON.stringify({ users: userEmails }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})