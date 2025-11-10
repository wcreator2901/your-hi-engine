-- Enable real-time updates for user_transactions table
ALTER TABLE user_transactions REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_transactions;