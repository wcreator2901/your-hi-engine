-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_required BOOLEAN DEFAULT FALSE,
  two_factor_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create user staking table
CREATE TABLE public.user_staking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  staking_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  last_calculation_time TIMESTAMP WITH TIME ZONE NOT NULL,
  accrued_profits DECIMAL(20, 8) DEFAULT 0,
  total_profits_earned DECIMAL(20, 8) DEFAULT 0,
  is_staking BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asset_symbol)
);

-- Create user seed phrases table
CREATE TABLE public.user_seed_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_seed_phrase TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create user wallets table
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  balance DECIMAL(20, 8) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user transactions table
CREATE TABLE public.user_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'stake', 'unstake', 'transfer')),
  asset_symbol TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  transaction_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  fee DECIMAL(20, 8) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bank accounts table
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES user_transactions(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bsb_number TEXT NOT NULL,
  amount_fiat DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user messages table (for chat functionality)
CREATE TABLE public.user_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  message_content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_staking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_seed_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for user_staking
CREATE POLICY "Users can view their own staking data" ON public.user_staking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own staking data" ON public.user_staking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own staking data" ON public.user_staking
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for user_seed_phrases
CREATE POLICY "Users can view their own seed phrase" ON public.user_seed_phrases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seed phrase" ON public.user_seed_phrases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seed phrase" ON public.user_seed_phrases
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for user_wallets
CREATE POLICY "Users can view their own wallets" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets" ON public.user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets" ON public.user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets" ON public.user_wallets
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_transactions
CREATE POLICY "Users can view their own transactions" ON public.user_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.user_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON public.user_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for bank_accounts
CREATE POLICY "Users can view bank accounts for their transactions" ON public.bank_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_transactions ut 
      WHERE ut.id = bank_accounts.transaction_id 
      AND ut.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bank accounts for their transactions" ON public.bank_accounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_transactions ut 
      WHERE ut.id = bank_accounts.transaction_id 
      AND ut.user_id = auth.uid()
    )
  );

-- Create RLS policies for user_messages
CREATE POLICY "Users can view messages they sent or received" ON public.user_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id OR 
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert their own messages" ON public.user_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = sender_id);

CREATE POLICY "Users can update messages they sent or received" ON public.user_messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id OR 
    auth.uid() = user_id
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_staking_updated_at
  BEFORE UPDATE ON public.user_staking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_transactions_updated_at
  BEFORE UPDATE ON public.user_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_messages_updated_at
  BEFORE UPDATE ON public.user_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();