-- Add AUD and USD amount columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN usd_amount_display NUMERIC DEFAULT 0,
ADD COLUMN aud_amount_display NUMERIC DEFAULT 0;

-- Update existing transactions to populate the new columns
-- Assuming current usd_amount is the USD value
UPDATE public.transactions 
SET 
  usd_amount_display = usd_amount,
  aud_amount_display = usd_amount * 1.5; -- Default conversion rate, will be updated in real-time

-- Add comments for clarity
COMMENT ON COLUMN public.transactions.usd_amount_display IS 'Transaction amount in USD for display';
COMMENT ON COLUMN public.transactions.aud_amount_display IS 'Transaction amount in AUD for display';