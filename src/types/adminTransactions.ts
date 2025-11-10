
export interface Transaction {
  id: string;
  user_id: string;
  asset_symbol: string;
  transaction_type: string;
  crypto_amount: number;
  usd_amount: number;
  usd_amount_display: number;
  cad_amount_display: number;
  status: string;
  transaction_date: string;
  to_address?: string;
  transaction_hash?: string;
  bank_transfer_id?: string;
  currency?: string;
  exchange_rate?: number;
  user_profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export interface UserWallet {
  user_id: string;
  asset_symbol: string;
  balance_crypto: number;
}

export interface BankTransfer {
  id: string;
  account_name: string;
  account_number: string;
  bsb_number: string;
  email_or_mobile?: string;
  amount_fiat: number;
  currency: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}
