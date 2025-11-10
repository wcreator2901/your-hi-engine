-- Fix function search path security issue by using CASCADE
DROP FUNCTION IF EXISTS public.create_chat_notification() CASCADE;

CREATE OR REPLACE FUNCTION public.create_chat_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recreate the trigger
CREATE TRIGGER create_chat_notification_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_chat_notification();