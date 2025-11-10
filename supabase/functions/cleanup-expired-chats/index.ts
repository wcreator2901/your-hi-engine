import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Cleanup expired chats function triggered');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all rooms that should be deleted (scheduled_deletion_at <= NOW)
    const { data: roomsToDelete, error: fetchError } = await supabase
      .from('chat_rooms')
      .select('id')
      .not('scheduled_deletion_at', 'is', null)
      .lte('scheduled_deletion_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching rooms to delete:', fetchError);
      throw fetchError;
    }

    if (!roomsToDelete || roomsToDelete.length === 0) {
      console.log('No expired chats to clean up');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired chats to clean up',
          deletedCount: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${roomsToDelete.length} expired chat room(s) to delete`);

    let deletedCount = 0;
    const errors = [];

    // Delete each room and its associated data
    for (const room of roomsToDelete) {
      try {
        console.log(`Deleting room ${room.id} and its associated data`);

        // Delete notifications for this room
        const { error: notifError } = await supabase
          .from('chat_notifications')
          .delete()
          .eq('room_id', room.id);

        if (notifError) {
          console.error(`Error deleting notifications for room ${room.id}:`, notifError);
        }

        // Delete messages for this room
        const { error: msgError } = await supabase
          .from('chat_messages')
          .delete()
          .eq('room_id', room.id);

        if (msgError) {
          console.error(`Error deleting messages for room ${room.id}:`, msgError);
        }

        // Delete the room itself
        const { error: roomError } = await supabase
          .from('chat_rooms')
          .delete()
          .eq('id', room.id);

        if (roomError) {
          console.error(`Error deleting room ${room.id}:`, roomError);
          errors.push({ roomId: room.id, error: roomError.message });
        } else {
          deletedCount++;
          console.log(`Successfully deleted room ${room.id} and all associated data`);
        }

      } catch (error) {
        console.error(`Error processing room ${room.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ roomId: room.id, error: errorMessage });
      }
    }

    console.log(`Cleanup complete: deleted ${deletedCount} room(s)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleaned up ${deletedCount} expired chat room(s)`,
        deletedCount,
        totalFound: roomsToDelete.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleanup-expired-chats function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});