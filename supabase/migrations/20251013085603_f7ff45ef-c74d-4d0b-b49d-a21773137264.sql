-- Create comprehensive visitor activity tracking table
CREATE TABLE IF NOT EXISTS public.visitor_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_visitor_activity_session ON public.visitor_activity(session_id);
CREATE INDEX idx_visitor_activity_user ON public.visitor_activity(user_id);
CREATE INDEX idx_visitor_activity_ip ON public.visitor_activity(ip_address);
CREATE INDEX idx_visitor_activity_timestamp ON public.visitor_activity(timestamp DESC);
CREATE INDEX idx_visitor_activity_page ON public.visitor_activity(page_url);

-- Enable RLS
ALTER TABLE public.visitor_activity ENABLE ROW LEVEL SECURITY;

-- Admins can view all visitor activity
CREATE POLICY "Admins can view all visitor activity"
ON public.visitor_activity
FOR SELECT
USING (check_user_is_admin());

-- System can insert visitor activity
CREATE POLICY "System can insert visitor activity"
ON public.visitor_activity
FOR INSERT
WITH CHECK (true);

-- Users can view their own activity
CREATE POLICY "Users can view own activity"
ON public.visitor_activity
FOR SELECT
USING (auth.uid() = user_id);

-- Create table for suspicious activity detection
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  ip_address TEXT,
  user_id UUID,
  session_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for security alerts
CREATE INDEX idx_security_alerts_timestamp ON public.security_alerts(created_at DESC);
CREATE INDEX idx_security_alerts_ip ON public.security_alerts(ip_address);
CREATE INDEX idx_security_alerts_resolved ON public.security_alerts(is_resolved);

-- Enable RLS for security alerts
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage security alerts
CREATE POLICY "Admins can manage security alerts"
ON public.security_alerts
FOR ALL
USING (check_user_is_admin());