-- Migration: Real Blockchain Balance Service - Triggers and Maintenance
-- Description: Creates triggers, maintenance functions, and cleanup procedures
-- Date: 2024-12-18

-- =====================================================
-- 1. AUTOMATIC CLEANUP TRIGGERS
-- =====================================================

-- Function to clean up old balance history
CREATE OR REPLACE FUNCTION public.cleanup_old_balance_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete balance history older than 1 year
  DELETE FROM public.blockchain_balance_history
  WHERE created_at < (now() - INTERVAL '1 year');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO public.blockchain_error_logs (
    error_type, error_message, severity
  ) VALUES (
    'maintenance', 
    'Cleaned up ' || deleted_count || ' old balance history records', 
    'warning'
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old error logs
CREATE OR REPLACE FUNCTION public.cleanup_old_error_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete error logs older than 3 months
  DELETE FROM public.blockchain_error_logs
  WHERE created_at < (now() - INTERVAL '3 months')
    AND resolved = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up completed fetch jobs
CREATE OR REPLACE FUNCTION public.cleanup_completed_fetch_jobs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete completed jobs older than 7 days
  DELETE FROM public.blockchain_balance_fetch_jobs
  WHERE status IN ('completed', 'failed')
    AND completed_at < (now() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. BALANCE CACHE TRIGGERS
-- =====================================================

-- Trigger function to update user_wallets balance when cache is updated
CREATE OR REPLACE FUNCTION public.sync_user_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the corresponding user_wallets record
  UPDATE public.user_wallets
  SET 
    balance = NEW.balance_formatted,
    updated_at = now()
  WHERE user_id = NEW.user_id
    AND address = NEW.wallet_address
    AND asset_symbol = (
      SELECT symbol FROM public.supported_tokens 
      WHERE id = NEW.token_id
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync balance with user_wallets
CREATE TRIGGER sync_user_wallet_balance_trigger
  AFTER INSERT OR UPDATE OF balance_formatted
  ON public.blockchain_balance_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_wallet_balance();

-- =====================================================
-- 3. RATE LIMIT RESET TRIGGERS
-- =====================================================

-- Function to reset expired rate limits
CREATE OR REPLACE FUNCTION public.reset_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE public.blockchain_api_rate_limits
  SET 
    is_blocked = false,
    blocked_until = NULL,
    requests_made = 0,
    window_start = now(),
    updated_at = now()
  WHERE is_blocked = true 
    AND blocked_until < now();
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. MONITORING AND ALERTING FUNCTIONS
-- =====================================================

-- Function to get system health metrics
CREATE OR REPLACE FUNCTION public.get_blockchain_service_health()
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_unit TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'total_cached_balances'::TEXT,
    COUNT(*)::NUMERIC,
    'count'::TEXT,
    'info'::TEXT
  FROM public.blockchain_balance_cache
  
  UNION ALL
  
  SELECT 
    'stale_balances'::TEXT,
    COUNT(*)::NUMERIC,
    'count'::TEXT,
    CASE WHEN COUNT(*) > 100 THEN 'warning' ELSE 'ok' END::TEXT
  FROM public.blockchain_balance_cache
  WHERE is_stale = true
  
  UNION ALL
  
  SELECT 
    'error_balances'::TEXT,
    COUNT(*)::NUMERIC,
    'count'::TEXT,
    CASE WHEN COUNT(*) > 50 THEN 'critical' ELSE 'ok' END::TEXT
  FROM public.blockchain_balance_cache
  WHERE error_count > 0
  
  UNION ALL
  
  SELECT 
    'pending_jobs'::TEXT,
    COUNT(*)::NUMERIC,
    'count'::TEXT,
    CASE WHEN COUNT(*) > 1000 THEN 'warning' ELSE 'ok' END::TEXT
  FROM public.blockchain_balance_fetch_jobs
  WHERE status = 'pending'
  
  UNION ALL
  
  SELECT 
    'blocked_endpoints'::TEXT,
    COUNT(*)::NUMERIC,
    'count'::TEXT,
    CASE WHEN COUNT(*) > 5 THEN 'warning' ELSE 'ok' END::TEXT
  FROM public.blockchain_api_rate_limits
  WHERE is_blocked = true
  
  UNION ALL
  
  SELECT 
    'recent_errors'::TEXT,
    COUNT(*)::NUMERIC,
    'count'::TEXT,
    CASE WHEN COUNT(*) > 100 THEN 'critical' ELSE 'ok' END::TEXT
  FROM public.blockchain_error_logs
  WHERE created_at > (now() - INTERVAL '1 hour')
    AND severity IN ('error', 'critical');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get network status
CREATE OR REPLACE FUNCTION public.get_network_status()
RETURNS TABLE (
  network_name TEXT,
  is_active BOOLEAN,
  total_endpoints INTEGER,
  blocked_endpoints INTEGER,
  recent_errors INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bn.network_name,
    bn.is_active,
    (jsonb_array_length(bn.rpc_urls) + jsonb_array_length(bn.api_urls))::INTEGER as total_endpoints,
    COALESCE(blocked.count, 0)::INTEGER as blocked_endpoints,
    COALESCE(errors.count, 0)::INTEGER as recent_errors,
    CASE 
      WHEN NOT bn.is_active THEN 'inactive'
      WHEN COALESCE(blocked.count, 0) > 2 THEN 'degraded'
      WHEN COALESCE(errors.count, 0) > 10 THEN 'warning'
      ELSE 'healthy'
    END::TEXT as status
  FROM public.blockchain_networks bn
  LEFT JOIN (
    SELECT network_id, COUNT(*) as count
    FROM public.blockchain_api_rate_limits
    WHERE is_blocked = true
    GROUP BY network_id
  ) blocked ON bn.id = blocked.network_id
  LEFT JOIN (
    SELECT network_id, COUNT(*) as count
    FROM public.blockchain_error_logs
    WHERE created_at > (now() - INTERVAL '1 hour')
      AND severity IN ('error', 'critical')
    GROUP BY network_id
  ) errors ON bn.id = errors.network_id
  ORDER BY bn.priority_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. PARTITION MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create next month's partition for balance history
CREATE OR REPLACE FUNCTION public.create_next_balance_history_partition()
RETURNS TEXT AS $$
DECLARE
  next_month DATE;
  partition_name TEXT;
  start_date TEXT;
  end_date TEXT;
BEGIN
  -- Calculate next month
  next_month := date_trunc('month', now() + INTERVAL '1 month');
  
  -- Generate partition name
  partition_name := 'blockchain_balance_history_' || to_char(next_month, 'YYYY_MM');
  
  -- Generate date strings
  start_date := to_char(next_month, 'YYYY-MM-DD');
  end_date := to_char(next_month + INTERVAL '1 month', 'YYYY-MM-DD');
  
  -- Create partition if it doesn't exist
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.blockchain_balance_history FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
  
  RETURN partition_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create next month's partition for error logs
CREATE OR REPLACE FUNCTION public.create_next_error_logs_partition()
RETURNS TEXT AS $$
DECLARE
  next_month DATE;
  partition_name TEXT;
  start_date TEXT;
  end_date TEXT;
BEGIN
  next_month := date_trunc('month', now() + INTERVAL '1 month');
  partition_name := 'blockchain_error_logs_' || to_char(next_month, 'YYYY_MM');
  start_date := to_char(next_month, 'YYYY-MM-DD');
  end_date := to_char(next_month + INTERVAL '1 month', 'YYYY-MM-DD');
  
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.blockchain_error_logs FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
  
  RETURN partition_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to service role for maintenance functions
GRANT EXECUTE ON FUNCTION public.cleanup_old_balance_history() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_error_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_completed_fetch_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_expired_rate_limits() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_next_balance_history_partition() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_next_error_logs_partition() TO service_role;

-- Grant execute permissions to authenticated users for monitoring functions
GRANT EXECUTE ON FUNCTION public.get_blockchain_service_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_network_status() TO authenticated;

-- Grant execute permissions to authenticated users for balance functions
GRANT EXECUTE ON FUNCTION public.upsert_blockchain_balance(UUID, TEXT, UUID, TEXT, DECIMAL, DECIMAL, DECIMAL, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_balance_fetch_error(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_balance_fetch_job(UUID, JSONB, JSONB, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_portfolio_summary(UUID) TO authenticated;

-- Grant execute permissions to service role for all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- 7. SCHEDULED MAINTENANCE SETUP
-- =====================================================

-- Create a maintenance log table
CREATE TABLE IF NOT EXISTS public.blockchain_maintenance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  records_affected INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on maintenance log
ALTER TABLE public.blockchain_maintenance_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view maintenance logs
CREATE POLICY "Admins can view maintenance logs"
  ON public.blockchain_maintenance_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage maintenance logs
CREATE POLICY "Service role can manage maintenance logs"
  ON public.blockchain_maintenance_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to run all maintenance tasks
CREATE OR REPLACE FUNCTION public.run_blockchain_maintenance()
RETURNS TABLE (
  task_name TEXT,
  records_affected INTEGER,
  status TEXT
) AS $$
DECLARE
  log_id UUID;
  affected_count INTEGER;
BEGIN
  -- Cleanup old balance history
  INSERT INTO public.blockchain_maintenance_log (task_name, status)
  VALUES ('cleanup_balance_history', 'running')
  RETURNING id INTO log_id;
  
  BEGIN
    SELECT public.cleanup_old_balance_history() INTO affected_count;
    
    UPDATE public.blockchain_maintenance_log
    SET status = 'completed', records_affected = affected_count, completed_at = now()
    WHERE id = log_id;
    
    RETURN QUERY SELECT 'cleanup_balance_history'::TEXT, affected_count, 'completed'::TEXT;
  EXCEPTION WHEN OTHERS THEN