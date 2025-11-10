-- Allow admins to view all chat rooms
DROP POLICY IF EXISTS "Admins can view all chat rooms" ON public.chat_rooms;
CREATE POLICY "Admins can view all chat rooms"
ON public.chat_rooms
FOR SELECT
USING (public.check_user_is_admin(auth.uid()));