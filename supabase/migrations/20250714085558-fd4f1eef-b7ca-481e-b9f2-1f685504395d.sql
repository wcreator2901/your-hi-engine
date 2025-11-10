-- Debug and fix staking data for user d3b03325-6f4b-4803-a872-6de4e6af1952
-- First check current data then update

-- Update with explicit values
UPDATE public.user_staking 
SET 
  total_profits_earned = 0.975,
  updated_at = now()
WHERE id = '2a9a8278-fbe3-4bc1-b4a2-ab17d2cba9ab';

-- Verify the update
SELECT * FROM public.user_staking WHERE id = '2a9a8278-fbe3-4bc1-b4a2-ab17d2cba9ab';