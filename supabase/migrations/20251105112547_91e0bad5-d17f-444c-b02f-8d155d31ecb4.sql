-- Create table for live crypto prices
CREATE TABLE IF NOT EXISTS public.crypto_prices (
  id TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'crypto_prices' AND policyname = 'Anyone can view crypto prices'
  ) THEN
    CREATE POLICY "Anyone can view crypto prices"
    ON public.crypto_prices
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'crypto_prices' AND policyname = 'Admins can insert prices'
  ) THEN
    CREATE POLICY "Admins can insert prices"
    ON public.crypto_prices
    FOR INSERT
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'crypto_prices' AND policyname = 'Admins can update prices'
  ) THEN
    CREATE POLICY "Admins can update prices"
    ON public.crypto_prices
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Enable realtime
ALTER TABLE public.crypto_prices REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'crypto_prices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_prices;
  END IF;
END $$;