-- Create deposit_addresses table for user-specific deposit addresses
CREATE TABLE public.deposit_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_symbol TEXT NOT NULL,
  address TEXT NOT NULL,
  network TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_symbol)
);

-- Enable Row Level Security
ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own deposit addresses" 
ON public.deposit_addresses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deposit addresses" 
ON public.deposit_addresses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deposit addresses" 
ON public.deposit_addresses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deposit addresses" 
ON public.deposit_addresses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_deposit_addresses_updated_at
BEFORE UPDATE ON public.deposit_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update the function to also create deposit addresses for new users
CREATE OR REPLACE FUNCTION public.create_default_wallets_for_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create deposit addresses for the existing user who didn't get them
INSERT INTO public.deposit_addresses (user_id, asset_symbol, address, network, is_active)
SELECT 
    '83ac50bf-8e83-40d1-ad29-15efd0b8ab1d' as user_id,
    dw.asset_symbol,
    dw.wallet_address,
    'mainnet' as network,
    true as is_active
FROM public.default_wallets dw
WHERE NOT EXISTS (
    SELECT 1 FROM public.deposit_addresses da 
    WHERE da.user_id = '83ac50bf-8e83-40d1-ad29-15efd0b8ab1d' 
    AND da.asset_symbol = dw.asset_symbol
);