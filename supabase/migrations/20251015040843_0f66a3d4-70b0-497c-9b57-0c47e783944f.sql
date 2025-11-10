-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to call the edge function via HTTP
CREATE OR REPLACE FUNCTION public.trigger_staking_calculation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Schedule the function to run every 5 minutes
SELECT cron.schedule(
  'calculate-staking-profits-every-5min',
  '*/5 * * * *', -- Every 5 minutes
  $$SELECT public.trigger_staking_calculation()$$
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.trigger_staking_calculation() TO postgres;
GRANT USAGE ON SCHEMA cron TO postgres;