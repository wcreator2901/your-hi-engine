-- Create function to automatically create notifications when messages are inserted
CREATE OR REPLACE FUNCTION public.create_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  admin_user_id UUID;
BEGIN
  -- Determine who should receive the notification
  IF NEW.sender_type = 'user' THEN
    -- User sent message, notify all admins
    FOR admin_user_id IN 
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.chat_notifications (
        room_id,
        message_id,
        user_id,
        is_read
      ) VALUES (
        NEW.room_id,
        NEW.id,
        admin_user_id,
        false
      );
    END LOOP;
  ELSE
    -- Admin sent message, notify the room's user
    SELECT user_id INTO recipient_id 
    FROM public.chat_rooms 
    WHERE id = NEW.room_id;
    
    IF recipient_id IS NOT NULL THEN
      INSERT INTO public.chat_notifications (
        room_id,
        message_id,
        user_id,
        is_read
      ) VALUES (
        NEW.room_id,
        NEW.id,
        recipient_id,
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger to call the function after message insert
DROP TRIGGER IF EXISTS trigger_create_chat_notification ON public.chat_messages;
CREATE TRIGGER trigger_create_chat_notification
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_chat_notification();