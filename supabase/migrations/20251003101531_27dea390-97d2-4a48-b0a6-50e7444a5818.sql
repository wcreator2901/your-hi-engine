-- Add missing columns to chat_rooms table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_rooms' AND column_name = 'creator_id') THEN
    ALTER TABLE public.chat_rooms ADD COLUMN creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_rooms' AND column_name = 'status') THEN
    ALTER TABLE public.chat_rooms ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- Add missing columns to chat_messages table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'sender_type') THEN
    ALTER TABLE public.chat_messages ADD COLUMN sender_type TEXT;
  END IF;
END $$;

-- Create user_seed_phrases table
CREATE TABLE IF NOT EXISTS public.user_seed_phrases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  encrypted_phrase TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_seed_phrases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'user_seed_phrases' AND relrowsecurity = true
  ) THEN
    ALTER TABLE public.user_seed_phrases ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies for user_seed_phrases
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_seed_phrases' AND policyname = 'Users can view own seed phrase') THEN
    CREATE POLICY "Users can view own seed phrase"
      ON public.user_seed_phrases FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_seed_phrases' AND policyname = 'Users can insert own seed phrase') THEN
    CREATE POLICY "Users can insert own seed phrase"
      ON public.user_seed_phrases FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Extend user_wallets table with additional columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'asset_symbol') THEN
    ALTER TABLE public.user_wallets ADD COLUMN asset_symbol TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'nickname') THEN
    ALTER TABLE public.user_wallets ADD COLUMN nickname TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'balance_crypto') THEN
    ALTER TABLE public.user_wallets ADD COLUMN balance_crypto DECIMAL(20, 8) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'balance_fiat') THEN
    ALTER TABLE public.user_wallets ADD COLUMN balance_fiat DECIMAL(20, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'derivation_path') THEN
    ALTER TABLE public.user_wallets ADD COLUMN derivation_path TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'address_index') THEN
    ALTER TABLE public.user_wallets ADD COLUMN address_index INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'is_hd_wallet') THEN
    ALTER TABLE public.user_wallets ADD COLUMN is_hd_wallet BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_wallets' AND column_name = 'is_active') THEN
    ALTER TABLE public.user_wallets ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;