-- Create table for per-user private keys
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Table
CREATE TABLE IF NOT EXISTS public.user_private_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  private_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure one record per user (helps avoid duplicates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'user_private_keys_user_id_key'
  ) THEN
    ALTER TABLE public.user_private_keys ADD CONSTRAINT user_private_keys_user_id_key UNIQUE (user_id);
  END IF;
END$$;

-- 2) Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_private_keys_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_private_keys_updated_at
    BEFORE UPDATE ON public.user_private_keys
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 3) RLS and policies
ALTER TABLE public.user_private_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_private_keys' AND policyname = 'Users can view their own private key'
  ) THEN
    CREATE POLICY "Users can view their own private key"
      ON public.user_private_keys
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_private_keys' AND policyname = 'Users can insert their own private key'
  ) THEN
    CREATE POLICY "Users can insert their own private key"
      ON public.user_private_keys
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_private_keys' AND policyname = 'Users can update their own private key'
  ) THEN
    CREATE POLICY "Users can update their own private key"
      ON public.user_private_keys
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  -- DELETE (not used, but keep symmetric)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_private_keys' AND policyname = 'Users can delete their own private key'
  ) THEN
    CREATE POLICY "Users can delete their own private key"
      ON public.user_private_keys
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;