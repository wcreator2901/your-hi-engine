
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check if the user is authenticated and is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing Authorization header')
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Validate the JWT token using service role client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError) {
      console.error('Token validation error:', authError.message)
      if (authError.message.includes('invalid') || authError.message.includes('expired')) {
        throw new Error('Session expired. Please log out and log back in.')
      }
      throw new Error(`Authentication failed: ${authError.message}`)
    }
    
    if (!user) {
      console.error('No user found from token')
      throw new Error('Invalid authentication token')
    }

    console.log('User authenticated:', user.id, user.email)

    // Check if user is admin using the correct function name
    const { data: isAdmin, error: adminError } = await supabaseAdmin
      .rpc('check_user_is_admin', { check_user_id: user.id })

    if (adminError) {
      console.error('Admin check RPC error:', adminError)
      throw new Error(`Failed to verify admin status: ${adminError.message}`)
    }

    if (!isAdmin) {
      console.log('User is not an admin:', user.email)
      throw new Error('Admin access required. Your account does not have admin privileges.')
    }

    console.log('Admin verified:', user.email)

    // Get all users with their emails
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
