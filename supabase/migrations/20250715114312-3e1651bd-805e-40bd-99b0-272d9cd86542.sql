-- Create table for default wallet addresses that are assigned to new users
CREATE TABLE public.default_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_symbol TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  wallet_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.default_wallets ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Super admins can view all default wallets" 
ON public.default_wallets 
FOR SELECT 
USING (get_user_admin_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can insert default wallets" 
ON public.default_wallets 
FOR INSERT 
WITH CHECK (get_user_admin_role(auth.uid()) = 'super_admin' AND auth.uid() = created_by);

CREATE POLICY "Super admins can update default wallets" 
ON public.default_wallets 
FOR UPDATE 
USING (get_user_admin_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can delete default wallets" 
ON public.default_wallets 
FOR DELETE 
USING (get_user_admin_role(auth.uid()) = 'super_admin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_default_wallets_updated_at
BEFORE UPDATE ON public.default_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();