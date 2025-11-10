-- Create chat notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.chat_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.chat_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.chat_notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
  ON public.chat_notifications
  FOR ALL
  USING (check_user_is_admin());

-- Function to create notifications when a new message is sent
CREATE OR REPLACE FUNCTION public.create_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  admin_record RECORD;
BEGIN
  -- Update the room's last_message_at timestamp
  UPDATE public.chat_rooms
  SET last_message_at = NEW.created_at
  WHERE id = NEW.room_id;

  -- Determine who should receive the notification
  IF NEW.sender_type = 'user' THEN
    -- User sent message, notify all admins
    FOR admin_record IN 
      SELECT user_id FROM public.admin_users
    LOOP
      INSERT INTO public.chat_notifications (user_id, room_id, message_id)
      VALUES (admin_record.user_id, NEW.room_id, NEW.id);
    END LOOP;
  ELSE
    -- Admin sent message, notify the user
    SELECT user_id INTO recipient_id
    FROM public.chat_rooms
    WHERE id = NEW.room_id;
    
    IF recipient_id IS NOT NULL THEN
      INSERT INTO public.chat_notifications (user_id, room_id, message_id)
      VALUES (recipient_id, NEW.room_id, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create notifications
DROP TRIGGER IF EXISTS create_chat_notification_trigger ON public.chat_messages;
CREATE TRIGGER create_chat_notification_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_chat_notification();