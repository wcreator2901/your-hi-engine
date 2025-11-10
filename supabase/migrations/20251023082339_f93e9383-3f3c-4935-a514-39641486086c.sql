-- Enable realtime for chat_messages table
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Also ensure chat_notifications is set up for realtime
ALTER TABLE public.chat_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_notifications;