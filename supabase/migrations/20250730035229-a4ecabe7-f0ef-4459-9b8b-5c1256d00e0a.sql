-- Add HD wallet support to user_wallets table
ALTER TABLE public.user_wallets 
ADD COLUMN IF NOT EXISTS derivation_path TEXT,
ADD COLUMN IF NOT EXISTS address_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_hd_wallet BOOLEAN DEFAULT false;

-- Create index for efficient HD wallet queries
CREATE INDEX IF NOT EXISTS idx_user_wallets_hd ON public.user_wallets (user_id, asset_symbol, address_index);

-- Update existing records to mark them as non-HD wallets
UPDATE public.user_wallets 
SET is_hd_wallet = false 
WHERE is_hd_wallet IS NULL;