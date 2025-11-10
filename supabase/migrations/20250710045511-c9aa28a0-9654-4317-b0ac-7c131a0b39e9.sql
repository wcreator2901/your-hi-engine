-- Add 2FA support to user profiles
ALTER TABLE public.user_profiles 
ADD COLUMN two_factor_secret TEXT,
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN two_factor_verified BOOLEAN DEFAULT FALSE;

-- Create a table to store backup codes for 2FA
CREATE TABLE public.user_backup_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on backup codes table
ALTER TABLE public.user_backup_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for backup codes
CREATE POLICY "Users can view their own backup codes" 
ON public.user_backup_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own backup codes" 
ON public.user_backup_codes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert backup codes" 
ON public.user_backup_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes(user_id_param UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backup_codes TEXT[] := '{}';
  i INTEGER;
  code TEXT;
BEGIN
  -- Delete existing backup codes
  DELETE FROM public.user_backup_codes WHERE user_id = user_id_param;
  
  -- Generate 10 backup codes
  FOR i IN 1..10 LOOP
    code := UPPER(substring(encode(gen_random_bytes(4), 'hex') from 1 for 8));
    backup_codes := array_append(backup_codes, code);
    
    INSERT INTO public.user_backup_codes (user_id, code)
    VALUES (user_id_param, code);
  END LOOP;
  
  RETURN backup_codes;
END;
$$;