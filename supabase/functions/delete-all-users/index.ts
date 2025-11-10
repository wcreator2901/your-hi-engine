import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: adminCheck } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!adminCheck) {
      throw new Error('Only admins can delete all users');
    }

    console.log('🗑️ Starting bulk user deletion...');

    // Get all users except the current admin
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) throw listError;

    let deletedCount = 0;
    let skippedCount = 0;

    for (const targetUser of users) {
      // Skip the current admin user to prevent lockout
      if (targetUser.id === user.id) {
        console.log(`⏭️ Skipping current admin user: ${targetUser.email}`);
        skippedCount++;
        continue;
      }

      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
        if (deleteError) {
          console.error(`❌ Failed to delete user ${targetUser.email}:`, deleteError);
        } else {
          console.log(`✅ Deleted user: ${targetUser.email}`);
          deletedCount++;
        }
      } catch (err) {
        console.error(`❌ Error deleting user ${targetUser.email}:`, err);
      }
    }

    console.log(`🎉 Deletion complete: ${deletedCount} deleted, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedCount,
        skipped: skippedCount,
        message: `Deleted ${deletedCount} users, skipped ${skippedCount} (including current admin)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
