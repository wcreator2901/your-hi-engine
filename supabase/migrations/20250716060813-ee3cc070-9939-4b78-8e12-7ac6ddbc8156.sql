-- Add admin policies for user_transactions table to allow admins to manage all transactions

-- Allow admins to view all transactions
CREATE POLICY "Admins can view all transactions" 
ON public.user_transactions 
FOR SELECT 
TO authenticated
USING (get_user_admin_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- Allow admins to insert transactions for any user
CREATE POLICY "Admins can insert transactions for any user" 
ON public.user_transactions 
FOR INSERT 
TO authenticated
WITH CHECK (get_user_admin_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- Allow admins to update all transactions
CREATE POLICY "Admins can update all transactions" 
ON public.user_transactions 
FOR UPDATE 
TO authenticated
USING (get_user_admin_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- Allow admins to delete all transactions
CREATE POLICY "Admins can delete all transactions" 
ON public.user_transactions 
FOR DELETE 
TO authenticated
USING (get_user_admin_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));