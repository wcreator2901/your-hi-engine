-- Fix incorrect ETH balances that were set to 50 ETH by mistake
-- Reset to 0 for users who shouldn't have that balance

UPDATE public.user_wallets 
SET 
  balance_crypto = 0,
  balance_fiat = 0,
  updated_at = now()
WHERE user_id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2' 
  AND asset_symbol = 'ETH' 
  AND balance_crypto = 50;