-- Create missing wallet data for user 61b5f835-bb5b-4158-9a1d-804c9b741eb2
-- First check if records already exist, then insert only if they don't
INSERT INTO public.user_wallets (user_id, asset_symbol, wallet_address, nickname, balance_crypto, balance_fiat, is_active)
SELECT '61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'BTC', '1FUzkeVWYTXfPT4ZczfPrZxJuYY4KLGAtD', 'Bitcoin Wallet', 0, 0, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_wallets 
    WHERE user_id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2' AND asset_symbol = 'BTC'
);

INSERT INTO public.user_wallets (user_id, asset_symbol, wallet_address, nickname, balance_crypto, balance_fiat, is_active)
SELECT '61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'ETH', '0x008472488E56a1881d3126f16CadB0355D963995', 'Ethereum Wallet', 50, 151381, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_wallets 
    WHERE user_id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2' AND asset_symbol = 'ETH'
);

INSERT INTO public.user_wallets (user_id, asset_symbol, wallet_address, nickname, balance_crypto, balance_fiat, is_active)
SELECT '61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'USDT', '0x008472488E56a1881d3126f16CadB0355D963995', 'USDT (ERC20) Wallet', 0, 0, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_wallets 
    WHERE user_id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2' AND asset_symbol = 'USDT'
);

-- Create matching deposit addresses
INSERT INTO public.deposit_addresses (user_id, asset_symbol, address, network, is_active)
SELECT '61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'BTC', '1FUzkeVWYTXfPT4ZczfPrZxJuYY4KLGAtD', 'bitcoin', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.deposit_addresses 
    WHERE user_id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2' AND asset_symbol = 'BTC' AND network = 'bitcoin'
);

INSERT INTO public.deposit_addresses (user_id, asset_symbol, address, network, is_active)
SELECT '61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'ETH', '0x008472488E56a1881d3126f16CadB0355D963995', 'ethereum', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.deposit_addresses 
    WHERE user_id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2' AND asset_symbol = 'ETH' AND network = 'ethereum'
);

INSERT INTO public.deposit_addresses (user_id, asset_symbol, address, network, is_active)
SELECT '61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'USDT', '0x008472488E56a1881d3126f16CadB0355D963995', 'erc20', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.deposit_addresses 
    WHERE user_id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2' AND asset_symbol = 'USDT' AND network = 'erc20'
);

INSERT INTO public.deposit_addresses (user_id, asset_symbol, address, network, is_active)
SELECT '61b5f835-bb5b-4158-9a1d-804c9b741eb2', 'USDT', 'TLnAvt8jBmyh6m91PZeTsUPSN113E7KgK3', 'trc20', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.deposit_addresses 
    WHERE user_id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2' AND asset_symbol = 'USDT' AND network = 'trc20'
);