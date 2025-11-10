
export interface DepositAddress {
  id: string;
  user_id: string;
  asset_symbol: string;
  address: string;
  network: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepositAddressWithUser extends DepositAddress {
  user_profile?: {
    full_name?: string;
    username?: string;
  };
  user_email?: string;
}
