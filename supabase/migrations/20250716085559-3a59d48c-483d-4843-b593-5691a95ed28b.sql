-- Add RLS policy to allow users to mark messages as read in accessible rooms
CREATE POLICY "Users can mark messages as read in accessible rooms" 
ON public.chat_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM chat_rooms cr
    WHERE cr.id = chat_messages.room_id 
    AND (
      (NOT cr.is_private) OR 
      (cr.creator_id = auth.uid()) OR 
      (cr.user_id = auth.uid()) OR 
      (cr.admin_id = auth.uid())
    )
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM chat_rooms cr
    WHERE cr.id = chat_messages.room_id 
    AND (
      (NOT cr.is_private) OR 
      (cr.creator_id = auth.uid()) OR 
      (cr.user_id = auth.uid()) OR 
      (cr.admin_id = auth.uid())
    )
  )
);