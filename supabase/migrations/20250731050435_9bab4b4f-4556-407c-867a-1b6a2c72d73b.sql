-- Create 2FA user table
CREATE TABLE public.user_2fa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_encrypted TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes TEXT[], -- Array of hashed backup codes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id)
);

-- Enable RLS on 2FA table
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for 2FA table
CREATE POLICY "Users can view their own 2FA settings"
  ON public.user_2fa
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings"
  ON public.user_2fa
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
  ON public.user_2fa
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own 2FA settings"
  ON public.user_2fa
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all 2FA settings
CREATE POLICY "Admins can view all 2FA settings"
  ON public.user_2fa
  FOR SELECT
  USING (get_user_admin_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- Create trigger for updated_at
CREATE TRIGGER update_user_2fa_updated_at
  BEFORE UPDATE ON public.user_2fa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has 2FA enabled
CREATE OR REPLACE FUNCTION public.user_has_2fa_enabled(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM public.user_2fa WHERE user_id = user_uuid),
    false
  );
$$;