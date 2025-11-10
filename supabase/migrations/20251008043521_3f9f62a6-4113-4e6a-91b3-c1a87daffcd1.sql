-- Add admin insert policy for chat_rooms
CREATE POLICY "Admins can create chat rooms for any user"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (check_user_is_admin());