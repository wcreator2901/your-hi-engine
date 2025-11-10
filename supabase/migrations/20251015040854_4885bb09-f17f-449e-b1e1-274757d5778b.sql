-- Fix search path for trigger_staking_calculation function
DROP FUNCTION IF EXISTS public.trigger_staking_calculation();

CREATE OR REPLACE FUNCTION public.trigger_staking_calculation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://myydifblhstxlfktfiqr.supabase.co/functions/v1/calculate-staking-profits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWRpZmJsaHN0eGxma3RmaXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjI0ODQsImV4cCI6MjA3NDk5ODQ4NH0.EQJi_g5zoz12RevAhCX0IdRqIan5J10MxQlrTDBHaw0'
    ),
    body := '{}'::jsonb
  );
END;
$$;