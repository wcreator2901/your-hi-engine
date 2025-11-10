-- Fix admin RLS policy to prevent self-elevation
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.admin_users;

CREATE POLICY "Only super admins can create admin users" 
ON public.admin_users 
FOR INSERT 
WITH CHECK (get_user_admin_role(auth.uid()) = 'super_admin'::text);

-- Secure all database functions with proper search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_seed_phrases_updated_at()
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = $1
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_admin_role(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  RETURN (SELECT role FROM public.admin_users WHERE user_id = user_uuid LIMIT 1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_wallets_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
    -- Insert default wallets for the new user
    INSERT INTO public.user_wallets (user_id, asset_symbol, wallet_name, wallet_address, balance_crypto, balance_fiat, is_active)
    SELECT 
        NEW.user_id,
        dw.asset_symbol,
        dw.wallet_name,
        dw.wallet_address,
        0 as balance_crypto,
        0 as balance_fiat,
        true as is_active
    FROM public.default_wallets dw;
    
    -- Insert default deposit addresses for the new user
    INSERT INTO public.deposit_addresses (user_id, asset_symbol, address, network, is_active)
    SELECT 
        NEW.user_id,
        dw.asset_symbol,
        dw.wallet_address,
        'mainnet' as network,
        true as is_active
    FROM public.default_wallets dw;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT COALESCE(
    (SELECT email FROM public.user_profiles WHERE user_id = user_uuid),
    (SELECT email::text FROM auth.users WHERE id = user_uuid)
  );
$function$;

CREATE OR REPLACE FUNCTION public.calculate_user_staking_profits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
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

        -- Update the staking record - ACCUMULATE accrued_profits instead of resetting
        UPDATE public.user_staking 
        SET 
            accrued_profits = COALESCE(accrued_profits, 0) + new_profits,
            total_profits_earned = expected_total_profits,
            last_calculation_time = now_time,
            updated_at = now_time
        WHERE id = staking_record.id;

        RAISE LOG 'Updated staking for user %, ETH=%, new_profits=%, accumulated=%, total=%, time_elapsed=%s', 
            staking_record.user_id, eth_balance, new_profits, COALESCE(staking_record.accrued_profits, 0) + new_profits, expected_total_profits, time_since_last_calc;
    END LOOP;
END;
$function$;