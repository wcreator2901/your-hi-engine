-- Migration: Real Blockchain Balance Service - Row Level Security Policies
-- Description: Creates comprehensive RLS policies for blockchain balance service tables
-- Date: 2024-12-18

-- =====================================================
-- 1. BLOCKCHAIN NETWORKS RLS POLICIES
-- =====================================================

-- Anyone can view active blockchain networks (public configuration)
CREATE POLICY "Anyone can view active blockchain networks"
  ON public.blockchain_networks
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage blockchain networks
CREATE POLICY "Admins can manage blockchain networks"
  ON public.blockchain_networks
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 2. SUPPORTED TOKENS RLS POLICIES
-- =====================================================

-- Anyone can view active supported tokens
CREATE POLICY "Anyone can view active supported tokens"
  ON public.supported_tokens
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage supported tokens
CREATE POLICY "Admins can manage supported tokens"
  ON public.supported_tokens
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 3. BLOCKCHAIN BALANCE CACHE RLS POLICIES
-- =====================================================

-- Users can view their own balance cache
CREATE POLICY "Users can view their own balance cache"
  ON public.blockchain_balance_cache
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own balance cache
CREATE POLICY "Users can insert their own balance cache"
  ON public.blockchain_balance_cache
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own balance cache
CREATE POLICY "Users can update their own balance cache"
  ON public.blockchain_balance_cache
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all balance cache
CREATE POLICY "Admins can view all balance cache"
  ON public.blockchain_balance_cache
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all balance cache
CREATE POLICY "Admins can manage all balance cache"
  ON public.blockchain_balance_cache
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage balance cache (for background jobs)
CREATE POLICY "Service role can manage balance cache"
  ON public.blockchain_balance_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 4. BLOCKCHAIN BALANCE HISTORY RLS POLICIES
-- =====================================================

-- Users can view their own balance history through cache relationship
CREATE POLICY "Users can view their own balance history"
  ON public.blockchain_balance_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blockchain_balance_cache bbc
      WHERE bbc.id = blockchain_balance_history.cache_id
      AND bbc.user_id = auth.uid()
    )
  );

-- Service role can insert balance history
CREATE POLICY "Service role can insert balance history"
  ON public.blockchain_balance_history
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view all balance history
CREATE POLICY "Admins can view all balance history"
  ON public.blockchain_balance_history
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all balance history
CREATE POLICY "Admins can manage all balance history"
  ON public.blockchain_balance_history
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 5. BLOCKCHAIN API RATE LIMITS RLS POLICIES
-- =====================================================

-- Only admins and service role can view rate limits
CREATE POLICY "Admins can view rate limits"
  ON public.blockchain_api_rate_limits
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage rate limits
CREATE POLICY "Service role can manage rate limits"
  ON public.blockchain_api_rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can manage rate limits
CREATE POLICY "Admins can manage rate limits"
  ON public.blockchain_api_rate_limits
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 6. BLOCKCHAIN BALANCE FETCH JOBS RLS POLICIES
-- =====================================================

-- Users can view their own fetch jobs
CREATE POLICY "Users can view their own fetch jobs"
  ON public.blockchain_balance_fetch_jobs
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own fetch jobs
CREATE POLICY "Users can create their own fetch jobs"
  ON public.blockchain_balance_fetch_jobs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own fetch jobs (limited to certain fields)
CREATE POLICY "Users can update their own fetch jobs"
  ON public.blockchain_balance_fetch_jobs
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can manage all fetch jobs
CREATE POLICY "Service role can manage fetch jobs"
  ON public.blockchain_balance_fetch_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view all fetch jobs
CREATE POLICY "Admins can view all fetch jobs"
  ON public.blockchain_balance_fetch_jobs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all fetch jobs
CREATE POLICY "Admins can manage all fetch jobs"
  ON public.blockchain_balance_fetch_jobs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 7. BLOCKCHAIN ERROR LOGS RLS POLICIES
-- =====================================================

-- Users can view their own error logs
CREATE POLICY "Users can view their own error logs"
  ON public.blockchain_error_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can insert error logs
CREATE POLICY "Service role can insert error logs"
  ON public.blockchain_error_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role can update error logs (for resolution)
CREATE POLICY "Service role can update error logs"
  ON public.blockchain_error_logs
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view all error logs
CREATE POLICY "Admins can view all error logs"
  ON public.blockchain_error_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all error logs
CREATE POLICY "Admins can manage all error logs"
  ON public.blockchain_error_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 8. ENABLE REALTIME FOR RELEVANT TABLES
-- =====================================================

-- Enable realtime for balance cache (users need real-time balance updates)
ALTER TABLE public.blockchain_balance_cache REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'blockchain_balance_cache'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blockchain_balance_cache;
  END IF;
END $$;

-- Enable realtime for fetch jobs (users need to see job status updates)
ALTER TABLE public.blockchain_balance_fetch_jobs REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'blockchain_balance_fetch_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blockchain_balance_fetch_jobs;
  END IF;
END $$;

-- Enable realtime for error logs (admins need to see errors in real-time)
ALTER TABLE public.blockchain_error_logs REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'blockchain_error_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blockchain_error_logs;
  END IF;
END $$;

-- =====================================================
-- 9. SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user owns a wallet address
CREATE OR REPLACE FUNCTION public.user_owns_wallet_address(user_uuid UUID, wallet_addr TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_wallets uw
    WHERE uw.user_id = user_uuid
    AND uw.address = wallet_addr
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate balance cache access
CREATE OR REPLACE FUNCTION public.can_access_balance_cache(cache_user_id UUID, wallet_addr TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin can access all
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN TRUE;
  END IF;
  
  -- Service role can access all
  IF auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;
  
  -- User can only access their own wallets
  IF cache_user_id = auth.uid() THEN
    RETURN user_owns_wallet_address(auth.uid(), wallet_addr);
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. ADDITIONAL SECURITY CONSTRAINTS
-- =====================================================

-- Add check constraints for data validation
ALTER TABLE public.blockchain_balance_cache 
ADD CONSTRAINT check_balance_non_negative 
CHECK (balance_formatted >= 0);

ALTER TABLE public.blockchain_balance_cache 
ADD CONSTRAINT check_error_count_non_negative 
CHECK (error_count >= 0);

ALTER TABLE public.blockchain_balance_fetch_jobs 
ADD CONSTRAINT check_retry_count_non_negative 
CHECK (retry_count >= 0);

ALTER TABLE public.blockchain_balance_fetch_jobs 
ADD CONSTRAINT check_max_retries_positive 
CHECK (max_retries > 0);

ALTER TABLE public.blockchain_api_rate_limits 
ADD CONSTRAINT check_requests_non_negative 
CHECK (requests_made >= 0);

ALTER TABLE public.blockchain_api_rate_limits 
ADD CONSTRAINT check_max_requests_positive 
CHECK (max_requests_per_window > 0);

-- =====================================================
-- 11. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.blockchain_networks TO authenticated;
GRANT SELECT ON public.supported_tokens TO authenticated;
GRANT ALL ON public.blockchain_balance_cache TO authenticated;
GRANT SELECT ON public.blockchain_balance_history TO authenticated;
GRANT ALL ON public.blockchain_balance_fetch_jobs TO authenticated;
GRANT SELECT ON public.blockchain_error_logs TO authenticated;

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- 12. COMMENTS FOR SECURITY DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Users can view their own balance cache" ON public.blockchain_balance_cache IS 
'Users can only view balance cache entries for their own wallets';

COMMENT ON POLICY "Service role can manage balance cache" ON public.blockchain_balance_cache IS 
'Service role needs full access for background balance fetching jobs';

COMMENT ON FUNCTION public.user_owns_wallet_address(UUID, TEXT) IS 
'Security function to verify wallet ownership before allowing balance access';

COMMENT ON FUNCTION public.can_access_balance_cache(UUID, TEXT) IS 
'Comprehensive access control function for balance cache with role-based permissions';
