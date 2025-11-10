-- Create user_login_tracking table for IP tracking
CREATE TABLE IF NOT EXISTS public.user_login_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT NOT NULL,
  country TEXT,
  city TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ip_blocks table
CREATE TABLE IF NOT EXISTS public.ip_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type TEXT NOT NULL CHECK (block_type IN ('ip', 'country', 'range')),
  block_value TEXT NOT NULL,
  reason TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create blocked_access_attempts table
CREATE TABLE IF NOT EXISTS public.blocked_access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  country TEXT,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create smart_contracts table
CREATE TABLE IF NOT EXISTS public.smart_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_name TEXT NOT NULL,
  contract_description TEXT NOT NULL,
  contract_code TEXT,
  is_deployed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  deployment_address TEXT,
  network TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create contract_wallets table
CREATE TABLE IF NOT EXISTS public.contract_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.smart_contracts(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  wallet_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add constraint to limit 5 wallets per contract
CREATE OR REPLACE FUNCTION check_contract_wallet_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.contract_wallets WHERE contract_id = NEW.contract_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 wallets per contract allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_wallet_limit_trigger
BEFORE INSERT ON public.contract_wallets
FOR EACH ROW
EXECUTE FUNCTION check_contract_wallet_limit();

-- Enable RLS on all new tables
ALTER TABLE public.user_login_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_access_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_login_tracking
CREATE POLICY "Admins can view all login tracking"
  ON public.user_login_tracking FOR SELECT
  USING (get_user_admin_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "System can insert login tracking"
  ON public.user_login_tracking FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ip_blocks
CREATE POLICY "Admins can manage IP blocks"
  ON public.ip_blocks FOR ALL
  USING (get_user_admin_role(auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for blocked_access_attempts
CREATE POLICY "Admins can view blocked attempts"
  ON public.blocked_access_attempts FOR SELECT
  USING (get_user_admin_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "System can insert blocked attempts"
  ON public.blocked_access_attempts FOR INSERT
  WITH CHECK (true);

-- RLS Policies for smart_contracts
CREATE POLICY "Users can view active contracts"
  ON public.smart_contracts FOR SELECT
  USING (is_active = true OR get_user_admin_role(auth.uid()) IN ('admin', 'super_admin'));

CREATE POLICY "Admins can manage contracts"
  ON public.smart_contracts FOR ALL
  USING (get_user_admin_role(auth.uid()) IN ('admin', 'super_admin'));

-- RLS Policies for contract_wallets
CREATE POLICY "Users can view wallets of active contracts"
  ON public.contract_wallets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.smart_contracts 
      WHERE id = contract_wallets.contract_id 
      AND (is_active = true OR get_user_admin_role(auth.uid()) IN ('admin', 'super_admin'))
    )
  );

CREATE POLICY "Admins can manage contract wallets"
  ON public.contract_wallets FOR ALL
  USING (get_user_admin_role(auth.uid()) IN ('admin', 'super_admin'));

-- Create indexes for better performance
CREATE INDEX idx_user_login_tracking_user_id ON public.user_login_tracking(user_id);
CREATE INDEX idx_user_login_tracking_login_time ON public.user_login_tracking(login_time DESC);
CREATE INDEX idx_user_login_tracking_ip_address ON public.user_login_tracking(ip_address);
CREATE INDEX idx_user_login_tracking_country ON public.user_login_tracking(country);
CREATE INDEX idx_ip_blocks_is_active ON public.ip_blocks(is_active);
CREATE INDEX idx_smart_contracts_is_active ON public.smart_contracts(is_active);
CREATE INDEX idx_contract_wallets_contract_id ON public.contract_wallets(contract_id);