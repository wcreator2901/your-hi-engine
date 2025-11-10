-- Add missing columns to user_2fa table
ALTER TABLE public.user_2fa RENAME COLUMN enabled TO is_enabled;

-- Add missing columns to chat_rooms table
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add missing columns to chat_messages table
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_type TEXT;
ALTER TABLE public.chat_messages RENAME COLUMN message TO message_text;

-- Create user_seed_phrases table for HD wallet functionality
CREATE TABLE IF NOT EXISTS public.user_seed_phrases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  encrypted_phrase TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_seed_phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own seed phrase"
  ON public.user_seed_phrases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seed phrase"
  ON public.user_seed_phrases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Extend user_wallets table with additional wallet-specific columns
ALTER TABLE public.user_wallets ADD COLUMN IF NOT EXISTS asset_symbol TEXT;
ALTER TABLE public.user_wallets ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.user_wallets ADD COLUMN IF NOT EXISTS balance_crypto DECIMAL(20, 8) DEFAULT 0;
ALTER TABLE public.user_wallets ADD COLUMN IF NOT EXISTS balance_fiat DECIMAL(20, 2) DEFAULT 0;
ALTER TABLE public.user_wallets ADD COLUMN IF NOT EXISTS derivation_path TEXT;
ALTER TABLE public.user_wallets ADD COLUMN IF NOT EXISTS address_index INTEGER;
ALTER TABLE public.user_wallets ADD COLUMN IF NOT EXISTS is_hd_wallet BOOLEAN DEFAULT false;
ALTER TABLE public.user_wallets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;