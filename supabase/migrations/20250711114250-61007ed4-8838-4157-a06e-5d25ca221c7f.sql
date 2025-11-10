-- Create user staking table to track staking balances
CREATE TABLE public.user_staking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_symbol TEXT NOT NULL DEFAULT 'ETH',
  staking_start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_calculation_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accrued_profits NUMERIC NOT NULL DEFAULT 0,
  total_profits_earned NUMERIC NOT NULL DEFAULT 0,
  is_staking BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_staking ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own staking data" 
ON public.user_staking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own staking data" 
ON public.user_staking 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own staking data" 
ON public.user_staking 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all staking data" 
ON public.user_staking 
FOR SELECT 
USING (check_user_is_admin(auth.uid()));

CREATE POLICY "Admins can update all staking data" 
ON public.user_staking 
FOR ALL
USING (check_user_is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_staking_updated_at
BEFORE UPDATE ON public.user_staking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;