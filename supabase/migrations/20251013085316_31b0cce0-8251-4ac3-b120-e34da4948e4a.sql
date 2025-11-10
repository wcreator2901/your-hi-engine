-- Create table for tracking user login attempts with IP and location data
CREATE TABLE IF NOT EXISTS public.user_login_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  login_status TEXT NOT NULL DEFAULT 'success',
  login_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_user_login_tracking_user_id ON public.user_login_tracking(user_id);
CREATE INDEX idx_user_login_tracking_timestamp ON public.user_login_tracking(login_timestamp DESC);
CREATE INDEX idx_user_login_tracking_ip ON public.user_login_tracking(ip_address);

-- Enable RLS
ALTER TABLE public.user_login_tracking ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all login tracking data
CREATE POLICY "Admins can view all login tracking"
ON public.user_login_tracking
FOR SELECT
USING (check_user_is_admin());

-- Allow system to insert login tracking data
CREATE POLICY "System can insert login tracking"
ON public.user_login_tracking
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own login history
CREATE POLICY "Users can view own login history"
ON public.user_login_tracking
FOR SELECT
USING (auth.uid() = user_id);

-- Create table for IP blocking
CREATE TABLE IF NOT EXISTS public.ip_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_by UUID,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for IP blocks
ALTER TABLE public.ip_blocks ENABLE ROW LEVEL SECURITY;

-- Only admins can manage IP blocks
CREATE POLICY "Admins can manage IP blocks"
ON public.ip_blocks
FOR ALL
USING (check_user_is_admin());