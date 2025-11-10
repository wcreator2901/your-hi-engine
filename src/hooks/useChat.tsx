import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatRoom {
  id: string;
  user_id: string | null;
  admin_id: string | null;
  creator_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_message_at: string | null;
  status: 'active' | 'inactive' | 'resolved';
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_full_name?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_type: string;
  message_text: string | null;
  message_type?: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  updated_at?: string;
  is_read: boolean;
}

export const useChat = () => {
  const { user, isAdmin } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<{ [roomId: string]: number }>({});
  const [newMessageNotification, setNewMessageNotification] = useState<{roomId: string; message: string} | null>(null);
  
  // Refs for real-time subscriptions
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const roomsChannelRef = useRef<RealtimeChannel | null>(null);
  
  // Flags to prevent double subscriptions
  const isMessageSubscribedRef = useRef<boolean>(false);
  const isRoomsSubscribedRef = useRef<boolean>(false);
  const currentRoomIdRef = useRef<string | null>(null);

  const fetchRooms = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter rooms based on user role
      if (isAdmin) {
        // Admin sees all rooms
      } else {
        // Regular users only see their own rooms
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Get user details for admin view
      const roomsWithUserDetails = await Promise.all((data || []).map(async (room) => {
        let userEmail = null;
        let userFirstName = null;
        let userLastName = null;
        let userFullName = null;
        
        if (room.user_id && isAdmin) {
          try {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('email, first_name, last_name, full_name')
              .eq('user_id', room.user_id)
              .single();
              
            if (profileData) {
              userEmail = profileData.email;
              userFirstName = profileData.first_name;
              userLastName = profileData.last_name;
              userFullName = profileData.full_name;
            }
          } catch (err) {
            console.error('Error fetching user details:', err);
          }
        }
        
        return {
          ...room,
          status: room.status as 'active' | 'inactive' | 'resolved',
          user_email: userEmail,
          user_first_name: userFirstName,
          user_last_name: userLastName,
          user_full_name: userFullName
        };
      }));

      setRooms(roomsWithUserDetails);
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      setError(err.message);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        file_url: null,
        file_name: null,
        file_type: null
      })));
      
      console.log('Fetched messages for room:', roomId, 'count:', data?.length);
      
      // Don't call markMessagesAsRead here - it's already called in handleRoomSelect
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Function to update unread count for a specific room
  const updateUnreadCount = async (roomId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_notifications')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      setUnreadCount(prev => ({
        ...prev,
        [roomId]: data?.length || 0
      }));
    } catch (err: any) {
      console.error('Error updating unread count:', err);
    }
  };

  // Function to update unread counts for all rooms
  const updateAllUnreadCounts = async () => {
    if (!user || !rooms.length) return;
    
    console.log('Updating all unread counts for user:', user.id);
    const counts: { [roomId: string]: number } = {};
    
    await Promise.all(rooms.map(async (room) => {
      try {
        const { data, error } = await supabase
          .from('chat_notifications')
          .select('id')
          .eq('room_id', room.id)
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (!error) {
          counts[room.id] = data?.length || 0;
          console.log(`Room ${room.id} unread count:`, data?.length || 0);
        }
      } catch (err) {
        console.error('Error fetching unread count for room:', room.id, err);
      }
    }));
    
    console.log('Setting unread counts:', counts);
    setUnreadCount(counts);
  };

  const createRoom = async (targetUserId?: string) => {
    if (!user) return null;

    try {
      const userId = targetUserId || user.id;
      
      // Regular users can only have one room
      if (!isAdmin) {
        const { data: existingUserRoom } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (existingUserRoom) {
          console.log('User already has a room, returning existing room');
          await fetchRooms();
          return existingUserRoom;
        }
      }
      
      // First, check if a room already exists between this admin and user
      if (isAdmin && targetUserId) {
        const { data: existingRoom } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('admin_id', user.id)
          .eq('status', 'active')
          .single();
          
        if (existingRoom) {
          await fetchRooms();
          return existingRoom;
        }
      }
      
      // If no existing room found, create a new one
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          user_id: userId,
          admin_id: isAdmin ? user.id : null,
          creator_id: user.id,
          status: 'active' as const,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchRooms();
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const sendMessage = async (roomId: string, messageText?: string) => {
    if (!user || !messageText?.trim()) return;

    // Create optimistic message for immediate UI update
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      room_id: roomId,
      sender_id: user.id,
      sender_type: isAdmin ? 'admin' : 'user',
      message_text: messageText.trim(),
      message_type: 'text',
      file_url: null,
      file_name: null,
      file_type: null,
      created_at: new Date().toISOString(),
      is_read: false
    };

    // Immediately add to local state for instant appearance
    setMessages(prevMessages => {
      console.log('Adding optimistic message:', optimisticMessage);
      return [...prevMessages, optimisticMessage];
    });

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          sender_type: isAdmin ? 'admin' : 'user',
          message_text: messageText.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      
      // Replace optimistic message with real message
      setMessages(prevMessages => {
        const realMessage = {
          ...data,
          file_url: null,
          file_name: null,
          file_type: null
        } as ChatMessage;
        
        console.log('Replacing optimistic message with real message:', realMessage);
        
        return prevMessages.map(msg => 
          msg.id === optimisticMessage.id ? realMessage : msg
        );
      });
      
      // Update room's last_message_at
      await supabase
        .from('chat_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', roomId);
        
    } catch (err: any) {
      console.error('Error sending message:', err);
      // Remove optimistic message on error
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== optimisticMessage.id)
      );
      setError(err.message);
    }
  };

  const markMessagesAsRead = async (roomId: string) => {
    if (!user) return;
    
    console.log('Marking messages as read for room:', roomId);

    try {
      // Mark notifications as read in chat_notifications table
      const { data, error } = await supabase
        .from('chat_notifications')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .eq('is_read', false)
        .select('id');

      if (error) throw error;
      
      console.log('Marked', data?.length || 0, 'notifications as read for room:', roomId);
      
      // Immediately clear the local unread count
      setUnreadCount(prev => {
        const newCount = { ...prev, [roomId]: 0 };
        console.log('Cleared local unread count:', newCount);
        return newCount;
      });
      
    } catch (err: any) {
      console.error('Error marking messages as read:', err);
      setError(err.message);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    
    console.log('Clearing all notifications for user:', user.id);
    
    try {
      // Mark all notifications as read for this user
      const { data, error} = await supabase
        .from('chat_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .select('id, room_id');

      if (error) throw error;
      
      console.log('Cleared all notifications - marked', (data || []).length, 'notifications as read');
      
      // Clear all local unread counts
      setUnreadCount({});
      
      // Force refresh the unread counts to ensure consistency
      setTimeout(() => {
        updateAllUnreadCounts();
      }, 200);
      
    } catch (err: any) {
      console.error('Error clearing all notifications:', err);
      setError(err.message);
    }
  };

  const deleteConversation = async (roomId: string) => {
    if (!user || !isAdmin) return;

    try {
      // 1) Delete notifications for this room (avoid lingering badges)
      const { error: notifError } = await supabase
        .from('chat_notifications')
        .delete()
        .eq('room_id', roomId);
      if (notifError) throw notifError;

      // 2) Delete all messages first
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('room_id', roomId);
      if (messagesError) throw messagesError;

      // 3) Delete the room
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);
      if (roomError) throw roomError;

      // 4) Optimistically update local state so the card disappears immediately
      setRooms(prev => prev.filter(r => r.id !== roomId));
      if (currentRoomIdRef.current === roomId) {
        setCurrentRoom(null);
        setMessages([]);
      }
      setUnreadCount(prev => {
        const next = { ...prev } as any;
        delete next[roomId];
        return next;
      });

      // 5) Final fetch to keep everything consistent
      await fetchRooms();
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      setError(err.message);
    }
  };

  const deleteMessage = async (messageId: string, roomId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      // Remove message from local state immediately
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== messageId)
      );
      
    } catch (err: any) {
      console.error('Error deleting message:', err);
      setError(err.message);
    }
  };

  const deleteAllConversations = async () => {
    if (!user || !isAdmin) return;

    try {
      // Delete all messages first
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all messages

      if (messagesError) throw messagesError;

      // Delete all rooms
      const { error: roomsError } = await supabase
        .from('chat_rooms')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rooms

      if (roomsError) throw roomsError;

      // Clear local state
      setRooms([]);
      setMessages([]);
      setCurrentRoom(null);
      
      await fetchRooms();
    } catch (err: any) {
      setError(err.message);
    }

  };

  // Set up real-time subscriptions for messages
  const setupMessageSubscription = (roomId: string) => {
    console.log('Setting up message subscription for room:', roomId);
    
    // Prevent double subscription
    if (isMessageSubscribedRef.current && currentRoomIdRef.current === roomId) {
      console.log('Already subscribed to messages for this room, skipping');
      return;
    }
    
    // Clean up existing subscription first
    if (messagesChannelRef.current) {
      console.log('Removing existing message channel');
      messagesChannelRef.current.unsubscribe();
      messagesChannelRef.current = null;
      isMessageSubscribedRef.current = false;
    }

    // Update current room reference
    currentRoomIdRef.current = roomId;

    // Create new channel with unique name
    const channelName = `messages-${roomId}-${user?.id}-${Date.now()}`;
    console.log('Creating new message channel:', channelName);
    
    messagesChannelRef.current = supabase.channel(channelName);
    
    // Set up message event listeners
    messagesChannelRef.current
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Real-time message INSERT received:', payload);
          const newMessage = {
            ...payload.new,
            file_url: null,
            file_name: null,
            file_type: null
          } as ChatMessage;
          
          // Add message instantly to current messages
          setMessages(prevMessages => {
            console.log('Adding new message to state:', newMessage);
            // Prevent duplicates - check both real ID and temporary optimistic ID
            const messageExists = prevMessages.some(msg => 
              msg.id === newMessage.id || 
              (msg.message_text === newMessage.message_text && 
               Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 2000)
            );
            if (messageExists) {
              console.log('Message already exists, replacing optimistic message');
              // Replace optimistic message with real one
              return prevMessages.map(msg => 
                msg.message_text === newMessage.message_text && 
                msg.sender_id === newMessage.sender_id &&
                msg.id.startsWith('temp-') ? newMessage : msg
              );
            }
            
            const updatedMessages = [...prevMessages, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            console.log('Updated messages:', updatedMessages);
            return updatedMessages;
          });
          
          // Show notification if message is from someone else and user is not on this room
          if (newMessage.sender_id !== user?.id) {
            console.log('New message from another user in current room');
            setNewMessageNotification({
              roomId: roomId,
              message: newMessage.message_text || 'New message received'
            });
            
            // Clear notification after 5 seconds
            setTimeout(() => {
              setNewMessageNotification(null);
            }, 5000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Real-time message UPDATE received:', payload);
          const updatedMessage = {
            ...payload.new,
            file_url: null,
            file_name: null,
            file_type: null
          } as ChatMessage;
          
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Real-time message DELETE received:', payload);
          const deletedId = payload.old.id;
          
          setMessages(prevMessages => 
            prevMessages.filter(msg => msg.id !== deletedId)
          );
        }
      )
      .subscribe((status) => {
        console.log('Message subscription status for room', roomId, ':', status);
        if (status === 'SUBSCRIBED') {
          isMessageSubscribedRef.current = true;
          console.log('Successfully subscribed to messages for room:', roomId);
        }
      });
  };

  // Set up real-time subscriptions for rooms
  const setupRoomsSubscription = () => {
    console.log('Setting up rooms subscription');
    
    // Prevent double subscription
    if (isRoomsSubscribedRef.current) {
      console.log('Already subscribed to rooms, skipping');
      return;
    }
    
    // Clean up existing subscription first
    if (roomsChannelRef.current) {
      console.log('Removing existing rooms channel');
      roomsChannelRef.current.unsubscribe();
      roomsChannelRef.current = null;
      isRoomsSubscribedRef.current = false;
    }

    // Create new channel with unique name
    const channelName = `chat-rooms-${user?.id}-${Date.now()}`;
    console.log('Creating new rooms channel:', channelName);
    
    roomsChannelRef.current = supabase.channel(channelName);
    
    // Set up room event listeners
    roomsChannelRef.current
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_rooms'
        },
        (payload) => {
          console.log('Real-time room INSERT received:', payload);
          // Refresh rooms when new room is created
          fetchRooms();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_rooms'
        },
        (payload) => {
          console.log('Real-time room UPDATE received:', payload);
          // Refresh rooms when room is updated (e.g., last_message_at)
          fetchRooms();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_rooms'
        },
        (payload) => {
          console.log('Real-time room DELETE received:', payload);
          // Refresh rooms when room is deleted
          fetchRooms();
        }
      )
      // Listen for notification changes (INSERT and UPDATE)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Real-time notification INSERT received:', payload);
          const notification = payload.new as any;
          
          // Increment unread count for this room
          setUnreadCount(prev => ({
            ...prev,
            [notification.room_id]: (prev[notification.room_id] || 0) + 1
          }));
          
          // Refresh rooms to update last_message_at
          fetchRooms();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Real-time notification UPDATE received:', payload);
          const notification = payload.new as any;
          
          // If notification was marked as read, decrement unread count
          if (notification.is_read) {
            setUnreadCount(prev => {
              const currentCount = prev[notification.room_id] || 0;
              return {
                ...prev,
                [notification.room_id]: Math.max(0, currentCount - 1)
              };
            });
          }
        }
      )
      // Global listener for message deletions (fallback to ensure all clients reflect removals)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          console.log('Global real-time message DELETE received (rooms channel):', payload);
          try {
            const deleted: any = payload.old;
            const rid = deleted?.room_id;
            const mid = deleted?.id;
            if (!rid || !mid) return;

            // If the currently open room matches, remove message locally
            if (currentRoomIdRef.current === rid) {
              setMessages(prev => prev.filter(m => m.id !== mid));
            }
            // Refresh rooms (e.g., last_message_at)
            fetchRooms();
          } catch (err) {
            console.error('Error handling global message delete event:', err);
          }
        }
      )
      .subscribe((status) => {
        console.log('Rooms subscription status:', status);
        if (status === 'SUBSCRIBED') {
          isRoomsSubscribedRef.current = true;
          console.log('Successfully subscribed to rooms and global messages');
        }
      });
  };

  // Clean up subscriptions
  const cleanupSubscriptions = () => {
    console.log('Cleaning up all subscriptions');
    
    if (messagesChannelRef.current) {
      console.log('Cleaning up message subscription');
      messagesChannelRef.current.unsubscribe();
      messagesChannelRef.current = null;
      isMessageSubscribedRef.current = false;
      currentRoomIdRef.current = null;
    }
    
    if (roomsChannelRef.current) {
      console.log('Cleaning up rooms subscription');
      roomsChannelRef.current.unsubscribe();
      roomsChannelRef.current = null;
      isRoomsSubscribedRef.current = false;
    }
  };

  // Set up initial data and room subscriptions
  useEffect(() => {
    if (user) {
      fetchRooms();
      setupRoomsSubscription();
    }
    setLoading(false);
    
    // Cleanup on unmount or user change
    return () => {
      console.log('Cleaning up subscriptions due to user change or unmount');
      cleanupSubscriptions();
    };
  }, [user?.id, isAdmin]); // Only user?.id and isAdmin as dependencies

  // Update unread counts when rooms change
  useEffect(() => {
    if (rooms.length > 0) {
      updateAllUnreadCounts();
    }
  }, [rooms.length, user?.id]);

  // Set up message subscription when current room changes
  useEffect(() => {
    if (currentRoom?.id && user?.id) {
      console.log('Current room changed, setting up subscription for:', currentRoom.id);
      setupMessageSubscription(currentRoom.id);
    }
    
    // Cleanup function - this will run when currentRoom.id changes or component unmounts
    return () => {
      if (messagesChannelRef.current && currentRoomIdRef.current !== currentRoom?.id) {
        console.log('Cleaning up message subscription due to room change');
        messagesChannelRef.current.unsubscribe();
        messagesChannelRef.current = null;
        isMessageSubscribedRef.current = false;
        currentRoomIdRef.current = null;
      }
    };
  }, [currentRoom?.id, user?.id]); // Keep these specific dependencies

  // Helper function to handle room selection
  const handleRoomSelect = useCallback(async (room: ChatRoom) => {
    console.log('Selecting room:', room.id);
    
    // Close the previous room first if there is one
    if (currentRoom && currentRoom.id !== room.id) {
      console.log('Closing previous room:', currentRoom.id);
      // Clean up previous room's messages
      setMessages([]);
    }
    
    // Now open the new room
    setCurrentRoom(room);
    await fetchMessages(room.id);
    await markMessagesAsRead(room.id);
  }, [currentRoom]);

  return {
    rooms,
    messages,
    currentRoom,
    loading,
    error,
    unreadCount,
    newMessageNotification,
    setCurrentRoom,
    handleRoomSelect,
    fetchMessages,
    createRoom,
    sendMessage,
    markMessagesAsRead,
    clearAllNotifications,
    deleteConversation,
    deleteMessage,
    deleteAllConversations,
    fetchRooms,
  };
};