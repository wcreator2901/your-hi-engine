-- Allow users to insert their own withdrawal transactions
CREATE POLICY "Users can insert own withdrawal transactions"
ON public.user_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND transaction_type = 'withdrawal');