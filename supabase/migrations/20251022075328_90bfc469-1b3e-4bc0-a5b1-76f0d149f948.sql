-- Add admin policies for user_transactions table
-- Admins need to be able to manage all user transactions

-- Allow admins to insert transactions for any user
CREATE POLICY "Admins can insert any transaction"
ON public.user_transactions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any transaction
CREATE POLICY "Admins can update any transaction"
ON public.user_transactions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.user_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete any transaction
CREATE POLICY "Admins can delete any transaction"
ON public.user_transactions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));