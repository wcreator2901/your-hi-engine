-- Enable realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Enable realtime for chat_notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_notifications;

-- Enable realtime for chat_rooms table (for last_message_at updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;

-- Ensure REPLICA IDENTITY is set for complete row data
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.chat_rooms REPLICA IDENTITY FULL;