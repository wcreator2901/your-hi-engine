/**
 * Shared type definitions for Bank Deposit functionality
 * Used across AdminBankDeposit, BankDeposit, EURConvert, BankTransfer, and AdminWalletManagement
 */

export interface BankDepositDetails {
  id: string;
  user_id: string;
  amount_eur: number;
  amount_usd?: number;
  is_visible?: boolean;
  account_name?: string;
  account_number?: string;
  iban?: string;
  bic_swift?: string;
  bank_name?: string;
  email_or_mobile?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  user_id?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface UserWallet {
  id: string;
  user_id: string;
  asset_symbol: string;
  balance_crypto: number;
  wallet_address?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Supported cryptocurrencies for EUR conversion
 */
export const SUPPORTED_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', cryptoId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', cryptoId: 'ethereum' },
  { symbol: 'USDT-ERC20', name: 'Tether (ERC20)', cryptoId: 'tether' },
  { symbol: 'USDC-ERC20', name: 'USD Coin (ERC20)', cryptoId: 'usd-coin' },
  { symbol: 'USDT_TRON', name: 'Tether (TRC20)', cryptoId: 'tether' },
] as const;

export type SupportedCryptoSymbol = typeof SUPPORTED_CRYPTOS[number]['symbol'];

/**
 * Stablecoin symbols for price calculations (always $1.00)
 */
export const STABLECOINS = [
  'USDT',
  'USDT-ERC20',
  'USDT_TRON',
  'USDT-TRC20',
  'USDC',
  'USDC-ERC20'
] as const;

/**
 * Check if a symbol is a stablecoin
 */
export const isStablecoin = (symbol: string): boolean => {
  return STABLECOINS.some(s => symbol.includes(s) || symbol === s);
};

/**
 * Default exchange rate (EUR per USD) - used as fallback when API fails
 */
export const DEFAULT_EUR_USD_RATE = 0.93;

/**
 * Exchange rate API endpoint
 */
export const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

/**
 * Exchange rate refresh interval in milliseconds (5 minutes)
 */
export const EXCHANGE_RATE_REFRESH_INTERVAL = 5 * 60 * 1000;
