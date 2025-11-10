-- Update staking data for user d3b03325-6f4b-4803-a872-6de4e6af1952 to reflect correct accumulated staking earnings
-- User has been staking 50 ETH since 2025-07-10 (4 days) at 0.65% daily rate
-- Total expected earnings for completed days: 50 * 0.0065 * 3 = 0.975 ETH (for 3 completed days)
-- Plus current day partial: ~0.16 ETH
-- Total accumulated from previous days should be around 0.975 ETH

UPDATE public.user_staking 
SET 
  total_profits_earned = 0.975,
  updated_at = now()
WHERE user_id = 'd3b03325-6f4b-4803-a872-6de4e6af1952' 
  AND asset_symbol = 'ETH';