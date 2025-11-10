-- Create security logs table for audit trails and monitoring
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for security logs (only admins can access)
CREATE POLICY "Only super admins can view security logs"
ON public.security_logs
FOR SELECT
USING (get_user_admin_role(auth.uid()) = 'super_admin');

CREATE POLICY "System can insert security logs"
ON public.security_logs
FOR INSERT
WITH CHECK (true); -- Allow system to insert logs

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);

-- Create a function to clean up old security logs (retention policy)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete logs older than 90 days, keeping critical events for 1 year
  DELETE FROM public.security_logs 
  WHERE (severity != 'critical' AND created_at < NOW() - INTERVAL '90 days')
     OR (severity = 'critical' AND created_at < NOW() - INTERVAL '1 year');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Create enhanced user session tracking table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id OR get_user_admin_role(auth.uid()) IS NOT NULL);

CREATE POLICY "Admins can view all sessions"
ON public.user_sessions
FOR SELECT
USING (get_user_admin_role(auth.uid()) = ANY(ARRAY['admin', 'super_admin']));

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON public.user_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON public.user_sessions(is_active);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired or old inactive sessions
  DELETE FROM public.user_sessions 
  WHERE expires_at < NOW() 
     OR (is_active = false AND last_activity < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;