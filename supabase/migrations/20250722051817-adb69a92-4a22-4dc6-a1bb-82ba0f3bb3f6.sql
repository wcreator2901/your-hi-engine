-- Create a function to handle staking calculation
CREATE OR REPLACE FUNCTION public.calculate_user_staking_profits()
RETURNS void AS $$
DECLARE
    staking_record RECORD;
    eth_balance NUMERIC;
    now_time TIMESTAMPTZ;
    time_since_last_calc NUMERIC;
    daily_rate NUMERIC := 0.0065; -- 0.65%
    secondly_rate NUMERIC;
    new_profits NUMERIC;
    total_time_staking NUMERIC;
    expected_total_profits NUMERIC;
BEGIN
    now_time := NOW();
    secondly_rate := daily_rate / (24 * 60 * 60); -- Convert to per-second rate

    -- Process all active staking records
    FOR staking_record IN 
        SELECT * FROM public.user_staking 
        WHERE is_staking = true
    LOOP
        -- Get user's ETH wallet balance
        SELECT COALESCE(balance_crypto, 0) INTO eth_balance
        FROM public.user_wallets 
        WHERE user_id = staking_record.user_id 
        AND asset_symbol = 'ETH'
        LIMIT 1;

        -- Skip if no ETH balance
        IF eth_balance <= 0 THEN
            CONTINUE;
        END IF;

        -- Calculate time elapsed since last calculation (in seconds)
        time_since_last_calc := EXTRACT(EPOCH FROM (now_time - staking_record.last_calculation_time));

        -- Calculate profit since last calculation
        new_profits := eth_balance * secondly_rate * time_since_last_calc;

        -- Calculate total expected profits since staking started
        total_time_staking := EXTRACT(EPOCH FROM (now_time - staking_record.staking_start_time));
        expected_total_profits := eth_balance * secondly_rate * total_time_staking;

        -- Update the staking record
        UPDATE public.user_staking 
        SET 
            accrued_profits = new_profits,
            total_profits_earned = expected_total_profits,
            last_calculation_time = now_time,
            updated_at = now_time
        WHERE id = staking_record.id;

        RAISE LOG 'Updated staking for user %, ETH=%, new_profits=%, total=%, time_elapsed=%s', 
            staking_record.user_id, eth_balance, new_profits, expected_total_profits, time_since_last_calc;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable the pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the staking calculation to run every minute
SELECT cron.schedule(
    'calculate-staking-profits',
    '* * * * *', -- every minute
    'SELECT public.calculate_user_staking_profits();'
);

-- Also trigger calculation when users log in or when staking data is queried
CREATE OR REPLACE FUNCTION public.trigger_staking_calculation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.calculate_user_staking_profits();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_staking table updates
DROP TRIGGER IF EXISTS trigger_staking_update ON public.user_staking;
CREATE TRIGGER trigger_staking_update
    AFTER UPDATE OR INSERT ON public.user_staking
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_staking_calculation();