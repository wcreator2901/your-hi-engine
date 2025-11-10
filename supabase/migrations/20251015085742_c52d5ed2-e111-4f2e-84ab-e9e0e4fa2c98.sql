-- Add email_or_mobile column to bank_accounts table
ALTER TABLE public.bank_accounts 
ADD COLUMN email_or_mobile text;