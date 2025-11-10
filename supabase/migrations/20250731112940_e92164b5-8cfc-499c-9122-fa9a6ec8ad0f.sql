-- Add daily_yield field to user_staking table
ALTER TABLE public.user_staking 
ADD COLUMN daily_yield_percent numeric DEFAULT 0.65;

-- Add admin policies for user_staking table
CREATE POLICY "Admins can view all user staking data" 
ON public.user_staking 
FOR SELECT 
USING (get_user_admin_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Admins can update all user staking data" 
ON public.user_staking 
FOR UPDATE 
USING (get_user_admin_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Admins can insert staking data for any user" 
ON public.user_staking 
FOR INSERT 
WITH CHECK (get_user_admin_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Admins can delete user staking data" 
ON public.user_staking 
FOR DELETE 
USING (get_user_admin_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));