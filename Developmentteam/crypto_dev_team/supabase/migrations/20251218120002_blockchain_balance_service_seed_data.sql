-- Migration: Real Blockchain Balance Service - Seed Data
-- Description: Seeds initial blockchain networks and supported tokens configuration
-- Date: 2024-12-18

-- =====================================================
-- 1. SEED BLOCKCHAIN NETWORKS
-- =====================================================

-- Insert Ethereum Mainnet
INSERT INTO public.blockchain_networks (
  network_name,
  network_type,
  rpc_urls,
  api_urls,
  block_explorer_url,
  native_currency,
  chain_id,
  is_active,
  priority_order,
  rate_limit_per_minute,
  timeout_seconds
) VALUES (
  'ethereum',
  'mainnet',
  '[
    "https://eth-mainnet.g.alchemy.com/v2/demo",
    "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    "https://ethereum.publicnode.com",
    "https://rpc.ankr.com/eth",
    "https://cloudflare-eth.com"
  ]'::jsonb,
  '[
    "https://api.etherscan.io/api",
    "https://api.ethplorer.io"
  ]'::jsonb,
  'https://etherscan.io',
  'ETH',
  1,
  true,
  1,
  60,
  30
) ON CONFLICT (network_name) DO UPDATE SET
  rpc_urls = EXCLUDED.rpc_urls,
  api_urls = EXCLUDED.api_urls,
  updated_at = now();

-- Insert Bitcoin Mainnet
INSERT INTO public.blockchain_networks (
  network_name,
  network_type,
  rpc_urls,
  api_urls,
  block_explorer_url,
  native_currency,
  chain_id,
  is_active,
  priority_order,
  rate_limit_per_minute,
  timeout_seconds
) VALUES (
  'bitcoin',
  'mainnet',
  '[]'::jsonb,
  '[
    "https://blockstream.info/api",
    "https://api.blockcypher.com/v1/btc/main",
    "https://api.blockchain.info"
  ]'::jsonb,
  'https://blockstream.info',
  'BTC',
  NULL,
  true,
  2,
  30,
  45
) ON CONFLICT (network_name) DO UPDATE SET
  api_urls = EXCLUDED.api_urls,
  updated_at = now();

-- Insert TRON Mainnet
INSERT INTO public.blockchain_networks (
  network_name,
  network_type,
  rpc_urls,
  api_urls,
  block_explorer_url,
  native_currency,
  chain_id,
  is_active,
  priority_order,
  rate_limit_per_minute,
  timeout_seconds
) VALUES (
  'tron',
  'mainnet',
  '[
    "https://api.trongrid.io",
    "https://api.tronstack.io",
    "https://api.nileex.io"
  ]'::jsonb,
  '[
    "https://api.trongrid.io",
    "https://apilist.tronscan.org"
  ]'::jsonb,
  'https://tronscan.org',
  'TRX',
  NULL,
  true,
  3,
  100,
  30
) ON CONFLICT (network_name) DO UPDATE SET
  rpc_urls = EXCLUDED.rpc_urls,
  api_urls = EXCLUDED.api_urls,
  updated_at = now();

-- =====================================================
-- 2. SEED SUPPORTED TOKENS
-- =====================================================

DO $$
DECLARE
  ethereum_network_id UUID;
  bitcoin_network_id UUID;
  tron_network_id UUID;
BEGIN
  SELECT id INTO ethereum_network_id FROM public.blockchain_networks WHERE network_name = 'ethereum';
  SELECT id INTO bitcoin_network_id FROM public.blockchain_networks WHERE network_name = 'bitcoin';
  SELECT id INTO tron_network_id FROM public.blockchain_networks WHERE network_name = 'tron';

  -- Insert Ethereum (ETH)
  INSERT INTO public.supported_tokens (
    symbol, name, network_id, contract_address, decimals, token_type, is_active, logo_url, coingecko_id
  ) VALUES (
    'ETH', 'Ethereum', ethereum_network_id, NULL, 18, 'native', true,
    'https://assets.coingecko.com/coins/images/279/small/ethereum.png', 'ethereum'
  ) ON CONFLICT (symbol, network_id, contract_address) DO UPDATE SET
    name = EXCLUDED.name, is_active = EXCLUDED.is_active, updated_at = now();

  -- Insert USDT on Ethereum (ERC-20)
  INSERT INTO public.supported_tokens (
    symbol, name, network_id, contract_address, decimals, token_type, is_active, logo_url, coingecko_id
  ) VALUES (
    'USDT', 'Tether USD (ERC-20)', ethereum_network_id, '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    6, 'erc20', true, 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png', 'tether'
  ) ON CONFLICT (symbol, network_id, contract_address) DO UPDATE SET
    name = EXCLUDED.name, is_active = EXCLUDED.is_active, updated_at = now();

  -- Insert USDC on Ethereum (ERC-20)
  INSERT INTO public.supported_tokens (
    symbol, name, network_id, contract_address, decimals, token_type, is_active, logo_url, coingecko_id
  ) VALUES (
    'USDC', 'USD Coin (ERC-20)', ethereum_network_id, '0xA0b86a33E6441b8435b662c6c6F8c8c6F8c8c6F8',
    6, 'erc20', true, 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png', 'usd-coin'
  ) ON CONFLICT (symbol, network_id, contract_address) DO UPDATE SET
    name = EXCLUDED.name, is_active = EXCLUDED.is_active, updated_at = now();

  -- Insert Bitcoin (BTC)
  INSERT INTO public.supported_tokens (
    symbol, name, network_id, contract_address, decimals, token_type, is_active, logo_url, coingecko_id
  ) VALUES (
    'BTC', 'Bitcoin', bitcoin_network_id, NULL, 8, 'native', true,
    'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', 'bitcoin'
  ) ON CONFLICT (symbol, network_id, contract_address) DO UPDATE SET
    name = EXCLUDED.name, is_active = EXCLUDED.is_active, updated_at = now();

  -- Insert TRON (TRX)
  INSERT INTO public.supported_tokens (
    symbol, name, network_id, contract_address, decimals, token_type, is_active, logo_url, coingecko_id
  ) VALUES (
    'TRX', 'TRON', tron_network_id, NULL, 6, 'native', true,
    'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', 'tron'
  ) ON CONFLICT (symbol, network_id, contract_address) DO UPDATE SET
    name = EXCLUDED.name, is_active = EXCLUDED.is_active, updated_at = now();

  -- Insert USDT on TRON (TRC-20)
  INSERT INTO public.supported_tokens (
    symbol, name, network_id, contract_address, decimals, token_type, is_active, logo_url, coingecko_id
  ) VALUES (
    'USDT_TRON', 'Tether USD (TRC-20)', tron_network_id, 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    6, 'trc20', true, 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png', 'tether'
  ) ON CONFLICT (symbol, network_id, contract_address) DO UPDATE SET
    name = EXCLUDED.name, is_active = EXCLUDED.is_active, updated_at = now();

END $$;

-- =====================================================
-- 3. CREATE VIEWS FOR EASY ACCESS
-- =====================================================

CREATE OR REPLACE VIEW public.active_tokens_with_networks AS
SELECT 
  st.id as token_id, st.symbol, st.name as token_name, st.contract_address, st.decimals, st.token_type,
  st.logo_url, st.coingecko_id, bn.id as network_id, bn.network_name, bn.network_type,
  bn.native_currency, bn.chain_id, bn.block_explorer_url, st.created_at, st.updated_at
FROM public.supported_tokens st
JOIN public.blockchain_networks bn ON st.network_id = bn.id
WHERE st.is_active = true AND bn.is_active = true
ORDER BY bn.priority_order, st.symbol;

CREATE OR REPLACE VIEW public.active_network_configs AS
SELECT 
  id as network_id, network_name, network_type, rpc_urls, api_urls, block_explorer_url,
  native_currency, chain_id, priority_order, rate_limit_per_minute, timeout_seconds,
  jsonb_array_length(rpc_urls) as rpc_count, jsonb_array_length(api_urls) as api_count
FROM public.blockchain_networks
WHERE is_active = true
ORDER BY priority_order;

-- =====================================================
-- 4. CREATE HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_token_by_symbol_and_network(
  token_symbol TEXT, network_name TEXT
)
RETURNS TABLE (
  token_id UUID, symbol TEXT, name TEXT, contract_address TEXT,
  decimals INTEGER, token_type TEXT, network_id UUID, coingecko_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT st.id, st.symbol, st.name, st.contract_address, st.decimals, st.token_type, st.network_id, st.coingecko_id
  FROM public.supported_tokens st
  JOIN public.blockchain_networks bn ON st.network_id = bn.id
  WHERE st.symbol = token_symbol AND bn.network_name = network_name
    AND st.is_active = true AND bn.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_wallet_addresses_with_tokens(user_uuid UUID)
RETURNS TABLE (
  wallet_address TEXT, asset_symbol TEXT, network_name TEXT, token_id UUID,
  token_name TEXT, contract_address TEXT, decimals INTEGER, token_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT uw.address, uw.asset_symbol, atwn.network_name, atwn.token_id, atwn.token_name,
         atwn.contract_address, atwn.decimals, atwn.token_type
  FROM public.user_wallets uw
  JOIN public.active_tokens_with_networks atwn ON uw.asset_symbol = atwn.symbol
  WHERE uw.user_id = user_uuid AND uw.address IS NOT NULL
  ORDER BY atwn.network_name, uw.asset_symbol;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_network_rpc_urls(network_name TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT rpc_urls INTO result
  FROM public.blockchain_networks
  WHERE network_name = get_network_rpc_urls.network_name AND is_active = true;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. GRANT PERMISSIONS ON VIEWS AND FUNCTIONS
-- =====================================================

GRANT SELECT ON public.active_tokens_with_networks TO authenticated;
GRANT SELECT ON public.active_network_configs TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_token_by_symbol_and_network(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_wallet_addresses_with_tokens(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_network_rpc_urls(TEXT) TO authenticated;

-- =====================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON VIEW public.active_tokens_with_networks IS 'View combining active tokens with their network information for easy querying';
COMMENT ON VIEW public.active_network_configs IS 'View showing active blockchain network configurations with endpoint counts';
COMMENT ON FUNCTION public.get_token_by_symbol_and_network(TEXT, TEXT) IS 'Helper function to find token configuration by symbol and network name';
COMMENT ON FUNCTION public.get_user_wallet_addresses_with_tokens(UUID) IS 'Function to get all user wallet addresses with their supported token information';
COMMENT ON FUNCTION public.get_network_rpc_urls(TEXT) IS 'Function to get RPC URLs for a specific network with failover support';
