-- Stop the EthStakingBoard from overriding, then set correct total_profits_earned
-- Update the record directly with the calculated total for previous days

UPDATE public.user_staking 
SET 
  total_profits_earned = 0.975,
  accrued_profits = 0.161,
  updated_at = now()
WHERE user_id = 'd3b03325-6f4b-4803-a872-6de4e6af1952' 
  AND asset_symbol = 'ETH';