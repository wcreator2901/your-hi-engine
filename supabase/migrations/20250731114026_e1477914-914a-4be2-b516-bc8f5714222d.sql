-- Add unique constraint to prevent duplicate staking entries per user/asset
ALTER TABLE public.user_staking 
ADD CONSTRAINT unique_user_asset_staking 
UNIQUE (user_id, asset_symbol);