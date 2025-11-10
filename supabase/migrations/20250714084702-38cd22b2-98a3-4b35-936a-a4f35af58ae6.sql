-- Update staking data for user d3b03325-6f4b-4803-a872-6de4e6af1952 to reflect correct staking earnings
-- User has been staking 50 ETH for approximately 4 days at 0.65% daily rate
-- Total expected earnings: 50 * 0.0065 * 4 = 1.3 ETH

UPDATE public.user_staking 
SET 
  total_profits_earned = 1.3,
  accrued_profits = 0.159,
  last_calculation_time = now(),
  updated_at = now()
WHERE user_id = 'd3b03325-6f4b-4803-a872-6de4e6af1952' 
  AND asset_symbol = 'ETH';