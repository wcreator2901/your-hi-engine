-- Enable RLS on bank_accounts if not already enabled
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can view their own bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Admins can insert bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Admins can update bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users can insert their own bank accounts" ON bank_accounts;

-- Allow admins to view all bank account records
CREATE POLICY "Admins can view all bank accounts"
ON bank_accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow users to view their own bank account records
CREATE POLICY "Users can view their own bank accounts"
ON bank_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to insert bank account records for any user
CREATE POLICY "Admins can insert bank accounts"
ON bank_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow users to insert their own bank account records
CREATE POLICY "Users can insert their own bank accounts"
ON bank_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow admins to update all bank account records
CREATE POLICY "Admins can update bank accounts"
ON bank_accounts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow users to update their own bank account records
CREATE POLICY "Users can update their own bank accounts"
ON bank_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);