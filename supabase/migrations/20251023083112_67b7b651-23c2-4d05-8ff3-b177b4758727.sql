-- Enable DELETE permissions for chat_messages table
-- Allow admins to delete any message
CREATE POLICY "Admins can delete any message"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);