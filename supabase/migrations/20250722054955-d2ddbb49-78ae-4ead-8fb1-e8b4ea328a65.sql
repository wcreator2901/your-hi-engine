-- Fix the infinite recursion issue by removing the trigger that was causing the problem
DROP TRIGGER IF EXISTS trigger_staking_update ON public.user_staking;

-- Remove the trigger function too since we don't need it anymore
DROP FUNCTION IF EXISTS public.trigger_staking_calculation();

-- The cron job will handle the calculations every minute, which is sufficient