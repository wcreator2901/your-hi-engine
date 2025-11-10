-- Remove foreign key constraints that reference auth.users
ALTER TABLE chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_user_id_fkey;
ALTER TABLE chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_admin_id_fkey;
ALTER TABLE chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_creator_id_fkey;

-- Update RLS policies to work without foreign key constraints
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view public chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Only creators can update their chat rooms" ON chat_rooms;

-- Create new policies
CREATE POLICY "Users can create chat rooms"
ON chat_rooms FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view accessible chat rooms"
ON chat_rooms FOR SELECT
USING (
  NOT is_private OR 
  creator_id = auth.uid() OR
  user_id = auth.uid() OR
  admin_id = auth.uid()
);

CREATE POLICY "Creators and admins can update chat rooms"
ON chat_rooms FOR UPDATE
USING (
  creator_id = auth.uid() OR
  (is_user_admin(auth.uid()) AND admin_id = auth.uid())
);

CREATE POLICY "Admins can delete chat rooms"
ON chat_rooms FOR DELETE
USING (is_user_admin(auth.uid()));

-- Update chat_messages policies to work better with the new structure
DROP POLICY IF EXISTS "Users can insert messages in accessible rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages in rooms they have access to" ON chat_messages;

CREATE POLICY "Users can insert messages in accessible rooms"
ON chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM chat_rooms cr
    WHERE cr.id = chat_messages.room_id AND (
      NOT cr.is_private OR
      cr.creator_id = auth.uid() OR
      cr.user_id = auth.uid() OR
      cr.admin_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can view messages in accessible rooms"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms cr
    WHERE cr.id = chat_messages.room_id AND (
      NOT cr.is_private OR
      cr.creator_id = auth.uid() OR
      cr.user_id = auth.uid() OR
      cr.admin_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own messages"
ON chat_messages FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Admins can delete messages"
ON chat_messages FOR DELETE
USING (is_user_admin(auth.uid()));