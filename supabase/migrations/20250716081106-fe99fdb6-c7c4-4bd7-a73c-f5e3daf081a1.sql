-- Enable realtime for chat tables
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;