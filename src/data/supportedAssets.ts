export interface SupportedAsset {
  id: string;         // price id key (matches crypto_prices.id)
  symbol: string;     // display symbol
  name: string;
  network?: string;
  logo?: string;      // optional glyph
}

export const supportedAssets: SupportedAsset[] = [
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', logo: 'Ξ' },
  { id: 'tether-erc20', symbol: 'USDT-ERC20', name: 'Tether (ERC20)', network: 'ERC20', logo: '₮' },
  { id: 'usd-coin', symbol: 'USDC-ERC20', name: 'USD Coin (ERC20)', network: 'ERC20', logo: '$' },
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', logo: '₿' },
  { id: 'usdt_tron', symbol: 'USDT_TRON', name: 'Tether (TRC20)', network: 'TRC20', logo: '₮' },
];