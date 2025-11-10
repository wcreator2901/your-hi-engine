import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useAdminNotifications = () => {
  const { user, isAdmin } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const notifiedMessagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only set up notifications for admins
    if (!user || !isAdmin) {
      return;
    }

    // Prevent double subscription
    if (isSubscribedRef.current) {
      return;
    }

    console.log('Setting up admin notifications for new messages');

    // Create unique channel for admin notifications
    const channelName = `admin-notifications-${user.id}-${Date.now()}`;
    channelRef.current = supabase.channel(channelName);

    // Listen for new messages in all chat rooms
    channelRef.current
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          console.log('Admin notification: New message received:', payload);
          
          const newMessage = payload.new;
          
          // Check if we've already notified about this message
          if (notifiedMessagesRef.current.has(newMessage.id)) {
            console.log('Already notified about message:', newMessage.id);
            return;
          }
          
          // Only show notification if message is not from admin
          if (newMessage.sender_type !== 'admin' && newMessage.sender_id !== user.id) {
            try {
              // Mark this message as notified
              notifiedMessagesRef.current.add(newMessage.id);
              
              // Get the room information to show user details
              const { data: roomData } = await supabase
                .from('chat_rooms')
                .select('id, user_id')
                .eq('id', newMessage.room_id)
                .single();

              // Get user email for the notification
              let userEmail = 'Unknown User';
              if (roomData?.user_id) {
                const { data: profileData } = await supabase
                  .from('user_profiles')
                  .select('email, full_name')
                  .eq('user_id', roomData.user_id)
                  .single();
                
                userEmail = profileData?.email || profileData?.full_name || 'Unknown User';
              }

              // Show toast notification
              toast({
                title: "New Message from User",
                description: `${userEmail}: ${newMessage.message_text?.slice(0, 50)}${newMessage.message_text?.length > 50 ? '...' : ''}`,
                duration: 5000,
              });

            } catch (error) {
              console.error('Error processing admin notification:', error);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Admin notifications subscription status:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });

    // Cleanup function
    return () => {
      console.log('Cleaning up admin notifications');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
      notifiedMessagesRef.current.clear();
    };
  }, [user, isAdmin]);

  return {
    // Could return notification state or controls here if needed
  };
};