-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create admin_users table
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin_users"
  ON public.admin_users FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Create user_wallets table
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_type TEXT NOT NULL,
  balance DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets"
  ON public.user_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets"
  ON public.user_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets"
  ON public.user_wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- Create user_transactions table
CREATE TABLE public.user_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  wallet_address TEXT,
  transaction_hash TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.user_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.user_transactions FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Admins can insert transactions"
  ON public.user_transactions FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Admins can update transactions"
  ON public.user_transactions FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Create bank_accounts table
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES public.user_transactions(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bsb_number TEXT NOT NULL,
  amount_fiat DECIMAL(20, 2) NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bank accounts"
  ON public.bank_accounts FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Admins can insert bank accounts"
  ON public.bank_accounts FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Create user_staking table
CREATE TABLE public.user_staking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  daily_rate DECIMAL(5, 4) DEFAULT 0.0065,
  total_earned DECIMAL(20, 8) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_claim_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_staking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own staking"
  ON public.user_staking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own staking"
  ON public.user_staking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own staking"
  ON public.user_staking FOR UPDATE
  USING (auth.uid() = user_id);

-- Create user_2fa table
CREATE TABLE public.user_2fa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own 2fa"
  ON public.user_2fa FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2fa"
  ON public.user_2fa FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2fa"
  ON public.user_2fa FOR UPDATE
  USING (auth.uid() = user_id);

-- Create chat_rooms table
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Users can create own chat rooms"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update chat rooms"
  ON public.chat_rooms FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Admins can delete chat rooms"
  ON public.chat_rooms FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their rooms"
  ON public.chat_messages FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM public.chat_rooms 
      WHERE user_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM public.admin_users)
    )
  );

CREATE POLICY "Users can send messages to their rooms"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (
      SELECT id FROM public.chat_rooms 
      WHERE user_id = auth.uid() OR auth.uid() IN (SELECT user_id FROM public.admin_users)
    )
  );

CREATE POLICY "Admins can update messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Admins can delete messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Create smart_contracts table
CREATE TABLE public.smart_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_name TEXT NOT NULL,
  contract_description TEXT,
  contract_code TEXT,
  is_deployed BOOLEAN DEFAULT false,
  deployment_address TEXT,
  network TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active contracts"
  ON public.smart_contracts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage contracts"
  ON public.smart_contracts FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Create contract_wallets table
CREATE TABLE public.contract_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES public.smart_contracts(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT NOT NULL,
  wallet_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contract_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contract wallets"
  ON public.contract_wallets FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage contract wallets"
  ON public.contract_wallets FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_transactions_updated_at BEFORE UPDATE ON public.user_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_staking_updated_at BEFORE UPDATE ON public.user_staking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_2fa_updated_at BEFORE UPDATE ON public.user_2fa
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_contracts_updated_at BEFORE UPDATE ON public.smart_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();