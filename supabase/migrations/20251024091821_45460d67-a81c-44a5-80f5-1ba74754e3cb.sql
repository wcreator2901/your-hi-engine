-- Add admin policies for user_staking table to allow admins to view and manage all staking data

-- Allow admins to view all staking records
CREATE POLICY "Admins can view all staking"
ON public.user_staking
FOR SELECT
USING (check_user_is_admin(auth.uid()));

-- Allow admins to update all staking records  
CREATE POLICY "Admins can update all staking"
ON public.user_staking
FOR UPDATE
USING (check_user_is_admin(auth.uid()));