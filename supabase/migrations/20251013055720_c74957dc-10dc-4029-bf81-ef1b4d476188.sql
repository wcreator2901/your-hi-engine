-- Create user_private_keys table
CREATE TABLE IF NOT EXISTS public.user_private_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  private_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_private_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own private key"
  ON public.user_private_keys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own private key"
  ON public.user_private_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all private keys"
  ON public.user_private_keys
  FOR SELECT
  USING (check_user_is_admin());

-- Create security_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  severity TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_logs
CREATE POLICY "Admins can view all security logs"
  ON public.security_logs
  FOR SELECT
  USING (check_user_is_admin());

CREATE POLICY "System can insert security logs"
  ON public.security_logs
  FOR INSERT
  WITH CHECK (true);