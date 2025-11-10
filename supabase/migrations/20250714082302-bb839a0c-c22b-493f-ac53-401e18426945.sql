-- Enable staking for all users who have ETH balance but are not staking
UPDATE user_staking 
SET is_staking = true,
    updated_at = NOW()
WHERE asset_symbol = 'ETH' 
AND is_staking = false
AND user_id IN (
  SELECT user_id 
  FROM user_wallets 
  WHERE asset_symbol = 'ETH' 
  AND balance_crypto > 0
);