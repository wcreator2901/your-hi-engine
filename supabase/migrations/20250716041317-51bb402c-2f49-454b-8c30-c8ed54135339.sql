-- Create default wallets for the user who didn't get them
INSERT INTO public.user_wallets (user_id, asset_symbol, wallet_name, wallet_address, balance_crypto, balance_fiat, is_active)
SELECT 
    '83ac50bf-8e83-40d1-ad29-15efd0b8ab1d' as user_id,
    dw.asset_symbol,
    dw.wallet_name,
    dw.wallet_address,
    0 as balance_crypto,
    0 as balance_fiat,
    true as is_active
FROM public.default_wallets dw
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_wallets uw 
    WHERE uw.user_id = '83ac50bf-8e83-40d1-ad29-15efd0b8ab1d' 
    AND uw.asset_symbol = dw.asset_symbol
);

-- Create a trigger to automatically create default wallets for new users
CREATE OR REPLACE FUNCTION public.create_default_wallets_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default wallets for the new user
    INSERT INTO public.user_wallets (user_id, asset_symbol, wallet_name, wallet_address, balance_crypto, balance_fiat, is_active)
    SELECT 
        NEW.user_id,
        dw.asset_symbol,
        dw.wallet_name,
        dw.wallet_address,
        0 as balance_crypto,
        0 as balance_fiat,
        true as is_active
    FROM public.default_wallets dw;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when a new user profile is created
DROP TRIGGER IF EXISTS trigger_create_default_wallets ON public.user_profiles;
CREATE TRIGGER trigger_create_default_wallets
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_wallets_for_user();