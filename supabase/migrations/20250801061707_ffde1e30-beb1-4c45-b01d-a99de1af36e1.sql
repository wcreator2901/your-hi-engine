-- Create table for storing daily portfolio snapshots
CREATE TABLE public.portfolio_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_value_usd NUMERIC NOT NULL DEFAULT 0,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one snapshot per user per day
  UNIQUE(user_id, snapshot_date)
);

-- Enable Row Level Security
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own portfolio snapshots" 
ON public.portfolio_snapshots 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio snapshots" 
ON public.portfolio_snapshots 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio snapshots" 
ON public.portfolio_snapshots 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can view all portfolio snapshots
CREATE POLICY "Admins can view all portfolio snapshots" 
ON public.portfolio_snapshots 
FOR SELECT 
USING (get_user_admin_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- Create function to update timestamps
CREATE TRIGGER update_portfolio_snapshots_updated_at
BEFORE UPDATE ON public.portfolio_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_portfolio_snapshots_user_date ON public.portfolio_snapshots(user_id, snapshot_date DESC);