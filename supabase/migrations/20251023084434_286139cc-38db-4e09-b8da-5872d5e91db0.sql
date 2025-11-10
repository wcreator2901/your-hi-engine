-- Allow admins to delete chat rooms
CREATE POLICY "Admins can delete chat rooms"
ON public.chat_rooms
FOR DELETE
TO authenticated
USING (check_user_is_admin(auth.uid()));

-- Allow admins to delete chat notifications (cleanup during room deletion)
CREATE POLICY "Admins can delete notifications"
ON public.chat_notifications
FOR DELETE
TO authenticated
USING (check_user_is_admin(auth.uid()));

-- Enable realtime for chat_rooms so clients receive DELETE events
ALTER TABLE public.chat_rooms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;