-- Add scheduled_deletion_at column to chat_rooms
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP WITH TIME ZONE;

-- Create function to schedule chat deletion when user reads admin message
CREATE OR REPLACE FUNCTION public.schedule_chat_deletion()
RETURNS TRIGGER AS $$
DECLARE
  admin_message_exists BOOLEAN;
  room_record RECORD;
BEGIN
  -- Only trigger when a notification changes from unread to read
  IF OLD.is_read = false AND NEW.is_read = true THEN
    -- Check if the message being read is from an admin
    SELECT EXISTS (
      SELECT 1 FROM public.chat_messages 
      WHERE id = NEW.message_id AND sender_type = 'admin'
    ) INTO admin_message_exists;

    IF admin_message_exists THEN
      -- Get room details
      SELECT * INTO room_record FROM public.chat_rooms WHERE id = NEW.room_id;

      -- Only schedule deletion if this is the user reading (not admin) and not already scheduled
      IF room_record.user_id = NEW.user_id AND room_record.scheduled_deletion_at IS NULL THEN
        UPDATE public.chat_rooms
        SET scheduled_deletion_at = NOW() + INTERVAL '48 hours'
        WHERE id = NEW.room_id;
        
        RAISE LOG 'Scheduled deletion for room % at %', NEW.room_id, NOW() + INTERVAL '48 hours';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger on chat_notifications table
DROP TRIGGER IF EXISTS trigger_schedule_chat_deletion ON public.chat_notifications;
CREATE TRIGGER trigger_schedule_chat_deletion
  AFTER UPDATE ON public.chat_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_chat_deletion();

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup function to run every hour
SELECT cron.schedule(
  'cleanup-expired-chats',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url:='https://odpbuqywjawbfhaddfch.supabase.co/functions/v1/cleanup-expired-chats',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcGJ1cXl3amF3YmZoYWRkZmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTEyNjksImV4cCI6MjA3NjU2NzI2OX0.QWJ3yWM3G1kVqwqJ-zy09PGihXiIqOyZCjumetUruIM"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);