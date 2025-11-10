
-- Add currency and exchange_rate columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN currency text DEFAULT 'USD',
ADD COLUMN exchange_rate numeric DEFAULT 1.0;
