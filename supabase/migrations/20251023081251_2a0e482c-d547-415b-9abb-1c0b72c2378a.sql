-- Backfill notifications for existing unread messages
INSERT INTO public.chat_notifications (room_id, message_id, user_id, is_read)
SELECT 
  cm.room_id,
  cm.id,
  ur.user_id,
  false
FROM chat_messages cm
CROSS JOIN user_roles ur
WHERE cm.is_read = false 
  AND cm.sender_type = 'user'
  AND ur.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM chat_notifications cn 
    WHERE cn.message_id = cm.id AND cn.user_id = ur.user_id
  );