-- Allow users to update their own bank deposit details (for EUR conversions)
CREATE POLICY "Users can update own bank deposit details" 
ON public.user_bank_deposit_details 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);