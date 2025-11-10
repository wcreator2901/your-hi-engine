-- =====================================================
-- REAL-TIME TRANSACTION SYSTEM PERFORMANCE OPTIMIZATION
-- =====================================================
-- This migration adds critical indexes for optimal real-time
-- transaction and wallet updates. These indexes ensure that
-- admin actions immediately reflect on user dashboards with
-- minimal latency.
--
-- Created: 2025-11-10
-- Purpose: Optimize real-time subscriptions and queries
-- =====================================================

-- ==========================================
-- INDEXES FOR user_transactions TABLE
-- ==========================================
-- These indexes optimize transaction queries by user, date, and status
-- Critical for admin filtering and user transaction history

-- Index for filtering transactions by user (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id
ON public.user_transactions(user_id);

-- Composite index for user transactions ordered by date (transaction history page)
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_created
ON public.user_transactions(user_id, created_at DESC);

-- Index for filtering by transaction status (pending, completed, failed)
CREATE INDEX IF NOT EXISTS idx_user_transactions_status
ON public.user_transactions(status);

-- Composite index for admin queries: user + status
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_status
ON public.user_transactions(user_id, status);

-- Index for currency/asset filtering
CREATE INDEX IF NOT EXISTS idx_user_transactions_currency
ON public.user_transactions(currency);

-- Composite index for complete admin filtering: user + currency + status + date
CREATE INDEX IF NOT EXISTS idx_user_transactions_admin_filter
ON public.user_transactions(user_id, currency, status, created_at DESC);

-- Index for transaction type filtering (deposit, withdrawal, bank_transfer, etc.)
CREATE INDEX IF NOT EXISTS idx_user_transactions_type
ON public.user_transactions(transaction_type);

-- ==========================================
-- INDEXES FOR user_wallets TABLE
-- ==========================================
-- These indexes optimize wallet balance queries and updates
-- Critical for real-time balance updates when transactions change

-- Index for user wallet queries (already exists but ensuring it's optimal)
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id
ON public.user_wallets(user_id);

-- Composite index for user + asset queries (most common pattern)
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_asset
ON public.user_wallets(user_id, asset_symbol);

-- Index for active wallets only (is_active = true)
CREATE INDEX IF NOT EXISTS idx_user_wallets_active
ON public.user_wallets(user_id, is_active)
WHERE is_active = true;

-- Index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_address
ON public.user_wallets(wallet_address);

-- Composite index for complete wallet queries with balance sorting
CREATE INDEX IF NOT EXISTS idx_user_wallets_balance
ON public.user_wallets(user_id, balance_crypto DESC)
WHERE is_active = true;

-- ==========================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ==========================================
-- Update statistics so PostgreSQL can use these indexes efficiently

ANALYZE public.user_transactions;
ANALYZE public.user_wallets;

-- ==========================================
-- VERIFICATION QUERIES (For debugging)
-- ==========================================
-- Uncomment these to verify index usage:

-- List all indexes on user_transactions
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'user_transactions'
-- ORDER BY indexname;

-- List all indexes on user_wallets
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'user_wallets'
-- ORDER BY indexname;

-- Check index usage statistics
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename IN ('user_transactions', 'user_wallets')
-- ORDER BY idx_scan DESC;
