-- Configure auth settings for better security
-- Note: These settings may need to be configured in the Supabase dashboard as well

-- Create a function to log security events server-side
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_logs (
    event_type,
    user_id,
    ip_address,
    user_agent,
    metadata,
    severity
  ) VALUES (
    p_event_type,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_metadata,
    p_severity
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function to validate password strength server-side
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
  score INTEGER := 0;
  issues TEXT[] := '{}';
BEGIN
  -- Initialize result
  result := jsonb_build_object('valid', false, 'score', 0, 'issues', '[]'::jsonb);
  
  -- Check minimum length
  IF length(password) < 8 THEN
    issues := array_append(issues, 'Password must be at least 8 characters long');
  ELSE
    score := score + 1;
  END IF;
  
  -- Check for uppercase letters
  IF password ~ '[A-Z]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password should contain uppercase letters');
  END IF;
  
  -- Check for lowercase letters
  IF password ~ '[a-z]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password should contain lowercase letters');
  END IF;
  
  -- Check for numbers
  IF password ~ '[0-9]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password should contain numbers');
  END IF;
  
  -- Check for special characters
  IF password ~ '[!@#$%^&*()_+\-=\[\]{};'':"\\|,.<>\/?]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password should contain special characters');
  END IF;
  
  -- Check against common passwords
  IF lower(password) = ANY(ARRAY[
    'password', '123456', '12345678', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', '1234567890'
  ]) THEN
    issues := array_append(issues, 'Password is too common');
    score := 0; -- Reset score for common passwords
  END IF;
  
  -- Determine if password is valid (score >= 3 and no critical issues)
  result := jsonb_build_object(
    'valid', score >= 3 AND array_length(issues, 1) IS NULL,
    'score', score,
    'issues', to_jsonb(issues)
  );
  
  RETURN result;
END;
$$;

-- Create trigger to log sensitive operations
CREATE OR REPLACE FUNCTION public.trigger_log_sensitive_operations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log seed phrase operations
  IF TG_TABLE_NAME = 'user_seed_phrases' THEN
    PERFORM public.log_security_event(
      'seed_phrase_' || lower(TG_OP),
      COALESCE(NEW.user_id, OLD.user_id),
      NULL,
      NULL,
      jsonb_build_object('table', TG_TABLE_NAME),
      'high'
    );
  END IF;
  
  -- Log admin user changes
  IF TG_TABLE_NAME = 'admin_users' THEN
    PERFORM public.log_security_event(
      'admin_user_' || lower(TG_OP),
      auth.uid(),
      NULL,
      NULL,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'target_user', COALESCE(NEW.user_id, OLD.user_id),
        'role', COALESCE(NEW.role, OLD.role)
      ),
      'critical'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply triggers to sensitive tables
DROP TRIGGER IF EXISTS log_seed_phrase_operations ON public.user_seed_phrases;
CREATE TRIGGER log_seed_phrase_operations
  AFTER INSERT OR UPDATE OR DELETE ON public.user_seed_phrases
  FOR EACH ROW EXECUTE FUNCTION public.trigger_log_sensitive_operations();

DROP TRIGGER IF EXISTS log_admin_user_operations ON public.admin_users;
CREATE TRIGGER log_admin_user_operations
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.trigger_log_sensitive_operations();