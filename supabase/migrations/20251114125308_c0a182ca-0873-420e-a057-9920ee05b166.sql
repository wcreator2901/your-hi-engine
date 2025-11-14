-- Add missing columns to bank_accounts table for SEPA transfers
ALTER TABLE public.bank_accounts 
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS bic_swift TEXT,
ADD COLUMN IF NOT EXISTS reference TEXT;