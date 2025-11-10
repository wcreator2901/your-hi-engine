import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useAdminUnreadCount = () => {
  const { user, isAdmin } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  // Function to fetch total unread count across all rooms
  const fetchUnreadCount = async () => {
    if (!user || !isAdmin) return;

    try {
      // Get all unread notifications for admin user
      const { data, error } = await supabase
        .from('chat_notifications')
        .select('id')
        .eq('is_read', false)
        .eq('user_id', user.id); // Count unread notifications for this admin

      if (error) {
        console.error('Error fetching unread count:', error);
        return;
      }

      const count = data?.length || 0;
      setTotalUnreadCount(count);
      console.log('Admin total unread notifications:', count);
    } catch (error) {
      console.error('Error in fetchUnreadCount:', error);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) {
      setTotalUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    // Prevent double subscription
    if (isSubscribedRef.current) {
      return;
    }

    console.log('Setting up admin unread count subscription');

    // Create unique channel for admin unread count
    const channelName = `admin-unread-count-${user.id}-${Date.now()}`;
    channelRef.current = supabase.channel(channelName);

    // Listen for notification changes
    channelRef.current
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'chat_notifications',
          filter: `user_id=eq.${user.id}` // Only listen to admin's own notifications
        },
        (payload) => {
          console.log('Admin unread count: Notification change detected:', payload);
          
          // Refetch count after any notification change
          setTimeout(() => {
            fetchUnreadCount();
          }, 100); // Small delay to ensure DB is updated
        }
      )
      .subscribe((status) => {
        console.log('Admin unread count subscription status:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });

    // Cleanup function
    return () => {
      console.log('Cleaning up admin unread count subscription');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
    };
  }, [user, isAdmin]);

  return {
    totalUnreadCount,
    refreshUnreadCount: fetchUnreadCount
  };
};