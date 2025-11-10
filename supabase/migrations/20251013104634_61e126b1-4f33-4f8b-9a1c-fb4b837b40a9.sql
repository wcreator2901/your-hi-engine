-- Fix RLS policies to allow users to submit bank transfers

-- Drop existing restrictive policy on user_transactions
DROP POLICY IF EXISTS "Users can insert own withdrawal transactions" ON user_transactions;

-- Create new policy allowing users to insert both withdrawals and bank transfers
CREATE POLICY "Users can insert own withdrawal and bank_transfer transactions"
ON user_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND transaction_type IN ('withdrawal', 'bank_transfer')
);

-- Drop existing restrictive policy on bank_accounts
DROP POLICY IF EXISTS "Admins can insert bank accounts" ON bank_accounts;

-- Create new policy allowing users to insert bank account records for their own transactions
CREATE POLICY "Users can insert bank accounts for own transactions"
ON bank_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  transaction_id IN (
    SELECT id FROM user_transactions WHERE user_id = auth.uid()
  )
);

-- Also allow admins to insert (keeping admin access)
CREATE POLICY "Admins can insert bank accounts"
ON bank_accounts
FOR INSERT
TO authenticated
WITH CHECK (check_user_is_admin());