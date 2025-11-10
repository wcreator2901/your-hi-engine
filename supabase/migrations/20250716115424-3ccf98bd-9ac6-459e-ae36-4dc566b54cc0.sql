-- Check if user has wallets, if not create them from default wallets
INSERT INTO public.user_wallets (user_id, asset_symbol, wallet_name, wallet_address, balance_crypto, balance_fiat, is_active)
SELECT 
    'b05d2185-ae4d-48b2-8801-f14e13cc908d' as user_id,
    dw.asset_symbol,
    dw.wallet_name,
    dw.wallet_address,
    0 as balance_crypto,
    0 as balance_fiat,
    true as is_active
FROM public.default_wallets dw
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_wallets uw 
    WHERE uw.user_id = 'b05d2185-ae4d-48b2-8801-f14e13cc908d' 
    AND uw.asset_symbol = dw.asset_symbol
);

-- Also create deposit addresses for this user
INSERT INTO public.deposit_addresses (user_id, asset_symbol, address, network, is_active)
SELECT 
    'b05d2185-ae4d-48b2-8801-f14e13cc908d' as user_id,
    dw.asset_symbol,
    dw.wallet_address,
    'mainnet' as network,
    true as is_active
FROM public.default_wallets dw
WHERE NOT EXISTS (
    SELECT 1 FROM public.deposit_addresses da 
    WHERE da.user_id = 'b05d2185-ae4d-48b2-8801-f14e13cc908d' 
    AND da.asset_symbol = dw.asset_symbol
);