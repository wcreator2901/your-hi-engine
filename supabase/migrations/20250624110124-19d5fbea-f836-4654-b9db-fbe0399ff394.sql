
-- First, let's check if RLS is enabled and what policies exist
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_seed_phrases';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_seed_phrases';

-- Add policy to allow admins to insert seed phrases for any user
CREATE POLICY "Allow admins to insert seed phrases" ON user_seed_phrases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.role = 'admin'
    )
  );

-- Add policy to allow admins to select seed phrases for any user
CREATE POLICY "Allow admins to select seed phrases" ON user_seed_phrases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.role = 'admin'
    )
  );

-- Add policy to allow users to select their own seed phrases
CREATE POLICY "Allow users to select own seed phrases" ON user_seed_phrases
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
