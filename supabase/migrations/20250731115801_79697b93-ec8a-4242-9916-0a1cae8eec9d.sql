-- Clean up inconsistent staking data: Reset staking for users with 0 ETH balance
-- This ensures staking only works when users actually have ETH

UPDATE user_staking 
SET 
  total_profits_earned = 0,
  accrued_profits = 0,
  is_staking = false,
  updated_at = NOW()
WHERE user_id IN (
  SELECT DISTINCT us.user_id 
  FROM user_staking us
  JOIN user_wallets uw ON us.user_id = uw.user_id 
  WHERE uw.asset_symbol = 'ETH' 
  AND uw.balance_crypto = 0
  AND us.asset_symbol = 'ETH'
);

-- Add a comment to document this cleanup
COMMENT ON TABLE user_staking IS 'Staking records for users. Only active when user has actual ETH balance > 0';