-- Allow admins to view and manage all user staking configurations
DROP POLICY IF EXISTS "Admins can view all staking" ON user_staking;
DROP POLICY IF EXISTS "Admins can update all staking" ON user_staking;
DROP POLICY IF EXISTS "Admins can insert staking" ON user_staking;

-- Create admin policies for full staking management
CREATE POLICY "Admins can view all staking"
ON user_staking FOR SELECT
TO authenticated
USING (check_user_is_admin());

CREATE POLICY "Admins can update all staking"
ON user_staking FOR UPDATE
TO authenticated
USING (check_user_is_admin());

CREATE POLICY "Admins can insert staking"
ON user_staking FOR INSERT
TO authenticated
WITH CHECK (check_user_is_admin());

CREATE POLICY "Admins can delete staking"
ON user_staking FOR DELETE
TO authenticated
USING (check_user_is_admin());