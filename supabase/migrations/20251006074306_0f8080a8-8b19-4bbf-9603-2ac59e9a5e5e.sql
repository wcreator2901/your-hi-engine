-- Update user_staking table to match liquid staking architecture

-- Step 1: Drop old columns not in spec
ALTER TABLE public.user_staking DROP COLUMN IF EXISTS amount CASCADE;
ALTER TABLE public.user_staking DROP COLUMN IF EXISTS last_claim_at CASCADE;

-- Step 2: Add new required columns
ALTER TABLE public.user_staking ADD COLUMN IF NOT EXISTS asset_symbol TEXT DEFAULT 'ETH';
ALTER TABLE public.user_staking ADD COLUMN IF NOT EXISTS last_calculation_time TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.user_staking ADD COLUMN IF NOT EXISTS accrued_profits NUMERIC DEFAULT 0;

-- Step 3: Rename columns to match spec (avoiding conflicts)
ALTER TABLE public.user_staking RENAME COLUMN is_active TO is_staking;
ALTER TABLE public.user_staking RENAME COLUMN started_at TO staking_start_time;
ALTER TABLE public.user_staking RENAME COLUMN daily_rate TO daily_yield_percent;
ALTER TABLE public.user_staking RENAME COLUMN total_earned TO total_profits_earned;

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_staking_active 
ON public.user_staking(user_id, is_staking) 
WHERE is_staking = true;