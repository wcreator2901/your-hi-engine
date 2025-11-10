-- Migration: Real Blockchain Balance Service - Database Functions and Triggers
-- Description: Creates stored procedures, functions, and triggers for blockchain balance operations
-- Date: 2024-12-18

-- =====================================================
-- 1. BALANCE CACHE MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to upsert balance cache with history tracking
CREATE OR REPLACE FUNCTION public.upsert_blockchain_balance(
  p_user_id UUID,
  p_wallet_address TEXT,
  p_token_id UUID,
  p_balance_raw TEXT,
  p_balance_formatted DECIMAL(36, 18),
  p_balance_usd DECIMAL(15, 2) DEFAULT NULL,
  p_price_per_token DECIMAL(15, 8) DEFAULT NULL,
  p_block_number BIGINT DEFAULT NULL,
  p_fetch_source TEXT DEFAULT 'api'
)
RETURNS UUID AS $$
DECLARE
  cache_id UUID;
  old_balance DECIMAL(36, 18);
  balance_changed BOOLEAN := false;
BEGIN
  -- Get existing balance for comparison
  SELECT id, balance_formatted INTO cache_id, old_balance
  FROM public.blockchain_balance_cache
  WHERE user_id = p_user_id 
    AND wallet_address = p_wallet_address 
    AND token_id = p_token_id;

  -- Check if balance changed significantly (more than 0.000001 difference)
  IF old_balance IS NULL OR ABS(old_balance - p_balance_formatted) > 0.000001 THEN
    balance_changed := true;
  END IF;

  -- Upsert balance cache
  INSERT INTO public.blockchain_balance_cache (
    user_id, wallet_address, token_id, balance_raw, balance_formatted,
    balance_usd, price_per_token, last_block_number, fetch_source,
    is_stale, error_count, last_error, last_updated
  ) VALUES (
    p_user_id, p_wallet_address, p_token_id, p_balance_raw, p_balance_formatted,
    p_balance_usd, p_price_per_token, p_block_number, p_fetch_source,
    false, 0, NULL, now()
  )
  ON CONFLICT (user_id, wallet_address, token_id)
  DO UPDATE SET
    balance_raw = EXCLUDED.balance_raw,
    balance_formatted = EXCLUDED.balance_formatted,
    balance_usd = EXCLUDED.balance_usd,
    price_per_token = EXCLUDED.price_per_token,
    last_block_number = EXCLUDED.last_block_number,
    fetch_source = EXCLUDED.fetch_source,
    is_stale = false,
    error_count = 0,
    last_error = NULL,
    last_updated = now(),
    updated_at = now()
  RETURNING id INTO cache_id;

  -- Insert into history if balance changed
  IF balance_changed THEN
    INSERT INTO public.blockchain_balance_history (
      cache_id, balance_raw, balance_formatted, balance_usd,
      price_per_token, block_number, recorded_at
    ) VALUES (
      cache_id, p_balance_raw, p_balance_formatted, p_balance_usd,
      p_price_per_token, p_block_number, now()
    );
  END IF;

  RETURN cache_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark balance cache as stale
CREATE OR REPLACE FUNCTION public.mark_balance_cache_stale(
  p_user_id UUID DEFAULT NULL,
  p_wallet_address TEXT DEFAULT NULL,
  p_token_id UUID DEFAULT NULL,
  p_older_than_minutes INTEGER DEFAULT 60
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.blockchain_balance_cache
  SET is_stale = true, updated_at = now()
  WHERE 
    (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_wallet_address IS NULL OR wallet_address = p_wallet_address)
    AND (p_token_id IS NULL OR token_id = p_token_id)
    AND last_updated < (now() - INTERVAL '1 minute' * p_older_than_minutes)
    AND is_stale = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record balance fetch error
CREATE OR REPLACE FUNCTION public.record_balance_fetch_error(
  p_user_id UUID,
  p_wallet_address TEXT,
  p_token_id UUID,
  p_error_message TEXT,
  p_error_type TEXT DEFAULT 'fetch_error'
)
RETURNS UUID AS $$
DECLARE
  cache_id UUID;
BEGIN
  -- Update error count in cache
  UPDATE public.blockchain_balance_cache
  SET 
    error_count = error_count + 1,
    last_error = p_error_message,
    updated_at = now()
  WHERE user_id = p_user_id 
    AND wallet_address = p_wallet_address 
    AND token_id = p_token_id
  RETURNING id INTO cache_id;

  -- If no cache entry exists, create one with error
  IF cache_id IS NULL THEN
    INSERT INTO public.blockchain_balance_cache (
      user_id, wallet_address, token_id, balance_raw, balance_formatted,
      error_count, last_error, is_stale
    ) VALUES (
      p_user_id, p_wallet_address, p_token_id, '0', 0,
      1, p_error_message, true
    )
    RETURNING id INTO cache_id;
  END IF;

  -- Log error
  INSERT INTO public.blockchain_error_logs (
    user_id, wallet_address, error_type, error_message, severity
  ) VALUES (
    p_user_id, p_wallet_address, p_error_type, p_error_message, 'error'
  );

  RETURN cache_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. RATE LIMITING FUNCTIONS
-- =====================================================

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_and_update_rate_limit(
  p_network_id UUID,
  p_endpoint_url TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_requests INTEGER;
  max_requests INTEGER;
  window_start TIMESTAMPTZ;
  is_blocked BOOLEAN;
  blocked_until TIMESTAMPTZ;
BEGIN
  -- Get current rate limit status
  SELECT 
    requests_made, max_requests_per_window, 
    blockchain_api_rate_limits.window_start, 
    blockchain_api_rate_limits.is_blocked, 
    blockchain_api_rate_limits.blocked_until
  INTO current_requests, max_requests, window_start, is_blocked, blocked_until
  FROM public.blockchain_api_rate_limits
  WHERE network_id = p_network_id AND endpoint_url = p_endpoint_url;

  -- If no rate limit record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.blockchain_api_rate_limits (
      network_id, endpoint_url, requests_made, window_start, max_requests_per_window
    ) VALUES (
      p_network_id, p_endpoint_url, 1, now(), 60
    );
    RETURN true;
  END IF;

  -- Check if currently blocked
  IF is_blocked AND blocked_until > now() THEN
    RETURN false;
  END IF;

  -- Reset window if expired (1 minute windows)
  IF window_start < (now() - INTERVAL '1 minute') THEN
    UPDATE public.blockchain_api_rate_limits
    SET 
      requests_made = 1,
      window_start = now(),
      is_blocked = false,
      blocked_until = NULL,
      updated_at = now()
    WHERE network_id = p_network_id AND endpoint_url = p_endpoint_url;
    RETURN true;
  END IF;

  -- Check if under rate limit
  IF current_requests < max_requests THEN
    UPDATE public.blockchain_api_rate_limits
    SET requests_made = requests_made + 1, updated_at = now()
    WHERE network_id = p_network_id AND endpoint_url = p_endpoint_url;
    RETURN true;
  ELSE
    -- Block for 1 minute
    UPDATE public.blockchain_api_rate_limits
    SET 
      is_blocked = true,
      blocked_until = now() + INTERVAL '1 minute',
      updated_at = now()
    WHERE network_id = p_network_id AND endpoint_url = p_endpoint_url;
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. BATCH PROCESSING FUNCTIONS
-- =====================================================

-- Function to create batch balance fetch job
CREATE OR REPLACE FUNCTION public.create_balance_fetch_job(
  p_user_id UUID,
  p_wallet_addresses JSONB,
  p_token_ids JSONB,
  p_priority INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  job_id UUID;
BEGIN
  INSERT INTO public.blockchain_balance_fetch_jobs (
    user_id, wallet_addresses, token_ids, priority, status
  ) VALUES (
    p_user_id, p_wallet_addresses, p_token_ids, p_priority, 'pending'
  )
  RETURNING id INTO job_id;
  
  RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next pending fetch job
CREATE OR REPLACE FUNCTION public.get_next_fetch_job()
RETURNS TABLE (
  job_id UUID,
  user_id UUID,
  wallet_addresses JSONB,
  token_ids JSONB,
  priority INTEGER,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.blockchain_balance_fetch_jobs
  SET status = 'running', started_at = now(), updated_at = now()
  WHERE id = (
    SELECT id FROM public.blockchain_balance_fetch_jobs
    WHERE status = 'pending' 
      AND scheduled_at <= now()
      AND retry_count < max_retries
    ORDER BY priority DESC, scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    blockchain_balance_fetch_jobs.id,
    blockchain_balance_fetch_jobs.user_id,
    blockchain_balance_fetch_jobs.wallet_addresses,
    blockchain_balance_fetch_jobs.token_ids,
    blockchain_balance_fetch_jobs.priority,
    blockchain_balance_fetch_jobs.retry_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete fetch job
CREATE OR REPLACE FUNCTION public.complete_fetch_job(
  p_job_id UUID,
  p_status TEXT,
  p_results JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_status = 'failed' THEN
    UPDATE public.blockchain_balance_fetch_jobs
    SET 
      status = CASE 
        WHEN retry_count + 1 >= max_retries THEN 'failed'
        ELSE 'pending'
      END,
      retry_count = retry_count + 1,
      error_message = p_error_message,
      scheduled_at = CASE 
        WHEN retry_count + 1 >= max_retries THEN scheduled_at
        ELSE now() + INTERVAL '5 minutes' * POWER(2, retry_count)
      END,
      completed_at = CASE 
        WHEN retry_count + 1 >= max_retries THEN now()
        ELSE NULL
      END,
      updated_at = now()
    WHERE id = p_job_id;
  ELSE
    UPDATE public.blockchain_balance_fetch_jobs
    SET 
      status = p_status,
      results = p_results,
      completed_at = now(),
      updated_at = now()
    WHERE id = p_job_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. ANALYTICS AND REPORTING FUNCTIONS
-- =====================================================

-- Function to get user portfolio summary
CREATE OR REPLACE FUNCTION public.get_user_portfolio_summary(
  p_user_id UUID
)
RETURNS TABLE (
  total_balance_usd DECIMAL(15, 2),
  token_count INTEGER,
  wallet_count INTEGER,
  last_updated TIMESTAMPTZ,
  stale_balances INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(bbc.balance_usd), 0) as total_balance_usd,
    COUNT(DISTINCT bbc.token_id)::INTEGER as token_count,
    COUNT(DISTINCT bbc.wallet_address)::INTEGER as wallet_count,
    MAX(bbc.last_updated) as last_updated,
    COUNT(CASE WHEN bbc.is_stale THEN 1 END)::INTEGER as stale_balances
  FROM public.blockchain_balance_cache bbc
  WHERE bbc.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get balance history for analytics
CREATE OR REPLACE FUNCTION public.get_balance_history(
  p_user_id UUID,
  p_wallet_address TEXT DEFAULT NULL,
  p_token_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  recorded_at TIMESTAMPTZ,
  wallet_address TEXT,
  token_symbol TEXT,
  balance_formatted DECIMAL(36, 18),
  balance_usd DECIMAL(15, 2),
  price_per_token DECIMAL(15, 8)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bbh.recorded_at,
    bbc.wallet_address,
    st.symbol as token_symbol,
    bbh.balance_formatted,