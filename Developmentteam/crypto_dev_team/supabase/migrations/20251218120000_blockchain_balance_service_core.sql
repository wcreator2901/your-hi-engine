-- Migration: Real Blockchain Balance Service - Core Tables
-- Description: Creates core tables for blockchain balance service with caching, error handling, and audit logging
-- Date: 2024-12-18

-- =====================================================
-- 1. BLOCKCHAIN NETWORK CONFIGURATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blockchain_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_name TEXT NOT NULL UNIQUE, -- 'ethereum', 'bitcoin', 'tron'
  network_type TEXT NOT NULL, -- 'mainnet', 'testnet'
  rpc_urls JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of RPC endpoint URLs
  api_urls JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of API endpoint URLs
  block_explorer_url TEXT,
  native_currency TEXT NOT NULL, -- 'ETH', 'BTC', 'TRX'
  chain_id INTEGER, -- For EVM chains
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority_order INTEGER NOT NULL DEFAULT 0, -- For failover ordering
  rate_limit_per_minute INTEGER DEFAULT 60,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blockchain_networks_active ON public.blockchain_networks (is_active, priority_order);
CREATE INDEX IF NOT EXISTS idx_blockchain_networks_name ON public.blockchain_networks (network_name);

-- =====================================================
-- 2. SUPPORTED TOKENS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.supported_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL, -- 'ETH', 'USDT', 'USDC', 'BTC', 'TRX'
  name TEXT NOT NULL, -- 'Ethereum', 'Tether USD', etc.
  network_id UUID NOT NULL REFERENCES public.blockchain_networks(id) ON DELETE CASCADE,
  contract_address TEXT, -- NULL for native tokens, contract address for ERC-20/TRC-20
  decimals INTEGER NOT NULL DEFAULT 18,
  token_type TEXT NOT NULL DEFAULT 'native', -- 'native', 'erc20', 'trc20', 'bep20'
  is_active BOOLEAN NOT NULL DEFAULT true,
  logo_url TEXT,
  coingecko_id TEXT, -- For price fetching
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure unique token per network
  UNIQUE(symbol, network_id, contract_address)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supported_tokens_active ON public.supported_tokens (is_active);
CREATE INDEX IF NOT EXISTS idx_supported_tokens_network ON public.supported_tokens (network_id);
CREATE INDEX IF NOT EXISTS idx_supported_tokens_symbol ON public.supported_tokens (symbol);
CREATE INDEX IF NOT EXISTS idx_supported_tokens_contract ON public.supported_tokens (contract_address) WHERE contract_address IS NOT NULL;

-- =====================================================
-- 3. BLOCKCHAIN BALANCE CACHE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blockchain_balance_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  token_id UUID NOT NULL REFERENCES public.supported_tokens(id) ON DELETE CASCADE,
  balance_raw TEXT NOT NULL DEFAULT '0', -- Raw balance as string to handle big numbers
  balance_formatted DECIMAL(36, 18) NOT NULL DEFAULT 0, -- Formatted balance with decimals
  balance_usd DECIMAL(15, 2) DEFAULT 0, -- USD value at time of fetch
  price_per_token DECIMAL(15, 8) DEFAULT 0, -- Token price in USD at time of fetch
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_block_number BIGINT, -- Block number when balance was fetched
  fetch_source TEXT NOT NULL, -- 'rpc', 'api', 'explorer'
  is_stale BOOLEAN NOT NULL DEFAULT false, -- Mark as stale if older than threshold
  error_count INTEGER NOT NULL DEFAULT 0, -- Track consecutive errors
  last_error TEXT, -- Last error message if any
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure unique cache entry per user/address/token
  UNIQUE(user_id, wallet_address, token_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_balance_cache_user ON public.blockchain_balance_cache (user_id);
CREATE INDEX IF NOT EXISTS idx_balance_cache_address ON public.blockchain_balance_cache (wallet_address);
CREATE INDEX IF NOT EXISTS idx_balance_cache_token ON public.blockchain_balance_cache (token_id);
CREATE INDEX IF NOT EXISTS idx_balance_cache_updated ON public.blockchain_balance_cache (last_updated);
CREATE INDEX IF NOT EXISTS idx_balance_cache_stale ON public.blockchain_balance_cache (is_stale, last_updated);
CREATE INDEX IF NOT EXISTS idx_balance_cache_errors ON public.blockchain_balance_cache (error_count) WHERE error_count > 0;

-- =====================================================
-- 4. BLOCKCHAIN BALANCE HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blockchain_balance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_id UUID NOT NULL REFERENCES public.blockchain_balance_cache(id) ON DELETE CASCADE,
  balance_raw TEXT NOT NULL,
  balance_formatted DECIMAL(36, 18) NOT NULL,
  balance_usd DECIMAL(15, 2),
  price_per_token DECIMAL(15, 8),
  block_number BIGINT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE IF NOT EXISTS public.blockchain_balance_history_2024_12 PARTITION OF public.blockchain_balance_history
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS public.blockchain_balance_history_2025_01 PARTITION OF public.blockchain_balance_history
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Create indexes on partitioned table
CREATE INDEX IF NOT EXISTS idx_balance_history_cache ON public.blockchain_balance_history (cache_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_history_recorded ON public.blockchain_balance_history (recorded_at DESC);

-- =====================================================
-- 5. BLOCKCHAIN API RATE LIMITS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blockchain_api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID NOT NULL REFERENCES public.blockchain_networks(id) ON DELETE CASCADE,
  endpoint_url TEXT NOT NULL,
  requests_made INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_duration_minutes INTEGER NOT NULL DEFAULT 1,
  max_requests_per_window INTEGER NOT NULL DEFAULT 60,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(network_id, endpoint_url)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_network ON public.blockchain_api_rate_limits (network_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON public.blockchain_api_rate_limits (is_blocked, blocked_until);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.blockchain_api_rate_limits (window_start);

-- =====================================================
-- 6. BLOCKCHAIN BALANCE FETCH JOBS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blockchain_balance_fetch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_addresses JSONB NOT NULL, -- Array of addresses to fetch
  token_ids JSONB NOT NULL, -- Array of token IDs to fetch
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  priority INTEGER NOT NULL DEFAULT 0, -- Higher number = higher priority
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  results JSONB, -- Store fetch results
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_user ON public.blockchain_balance_fetch_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_status ON public.blockchain_balance_fetch_jobs (status, priority DESC, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_fetch_jobs_scheduled ON public.blockchain_balance_fetch_jobs (scheduled_at) WHERE status = 'pending';

-- =====================================================
-- 7. BLOCKCHAIN ERROR LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.blockchain_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  network_id UUID REFERENCES public.blockchain_networks(id) ON DELETE SET NULL,
  wallet_address TEXT,
  token_symbol TEXT,
  error_type TEXT NOT NULL, -- 'network_error', 'rate_limit', 'invalid_address', 'timeout'
  error_code TEXT,
  error_message TEXT NOT NULL,
  endpoint_url TEXT,
  request_payload JSONB,
  response_payload JSONB,
  stack_trace TEXT,
  severity TEXT NOT NULL DEFAULT 'error', -- 'warning', 'error', 'critical'
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for error logs
CREATE TABLE IF NOT EXISTS public.blockchain_error_logs_2024_12 PARTITION OF public.blockchain_error_logs
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE IF NOT EXISTS public.blockchain_error_logs_2025_01 PARTITION OF public.blockchain_error_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON public.blockchain_error_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_network ON public.blockchain_error_logs (network_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON public.blockchain_error_logs (error_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.blockchain_error_logs (severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON public.blockchain_error_logs (resolved, created_at DESC) WHERE NOT resolved;

-- =====================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.blockchain_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_balance_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_balance_fetch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_error_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_blockchain_networks_updated_at
  BEFORE UPDATE ON public.blockchain_networks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supported_tokens_updated_at
  BEFORE UPDATE ON public.supported_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blockchain_balance_cache_updated_at
  BEFORE UPDATE ON public.blockchain_balance_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blockchain_api_rate_limits_updated_at
  BEFORE UPDATE ON public.blockchain_api_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blockchain_balance_fetch_jobs_updated_at
  BEFORE UPDATE ON public.blockchain_balance_fetch_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.blockchain_networks IS 'Configuration for supported blockchain networks with RPC endpoints and settings';
COMMENT ON TABLE public.supported_tokens IS 'Tokens supported on each blockchain network with contract addresses and metadata';
COMMENT ON TABLE public.blockchain_balance_cache IS 'Cached blockchain balances with USD values and error tracking';
COMMENT ON TABLE public.blockchain_balance_history IS 'Historical balance data partitioned by month for analytics';
COMMENT ON TABLE public.blockchain_api_rate_limits IS 'Rate limiting tracking for blockchain API endpoints';
COMMENT ON TABLE public.blockchain_balance_fetch_jobs IS 'Queue for batch balance fetching jobs with retry logic';
COMMENT ON TABLE public.blockchain_error_logs IS 'Comprehensive error logging for blockchain operations';

COMMENT ON COLUMN public.blockchain_balance_cache.balance_raw IS 'Raw balance