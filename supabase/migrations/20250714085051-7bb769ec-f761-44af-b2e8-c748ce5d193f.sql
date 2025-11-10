-- Reset staking data for user who had incorrect ETH balance
UPDATE public.user_staking 
SET 
  total_profits_earned = 0,
  accrued_profits = 0,
  is_staking = false,
  updated_at = now()
WHERE user_id = '61b5f835-bb5b-4158-9a1d-804c9b741eb2' 
  AND asset_symbol = 'ETH';