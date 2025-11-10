
export interface Crypto {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  balance: number;
  balanceUSD: number;
  network: string;
  logo: string;
}

// Mock data for cryptos when the API is not available
export const mockCryptos: Crypto[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 2890.75,
    change24h: 1.73,
    balance: 0,
    balanceUSD: 0,
    network: 'Ethereum',
    logo: 'Ξ'
  },
  {
    id: 'tether-erc20',
    name: 'Tether ERC20',
    symbol: 'USDT-ERC20',
    price: 1.00,
    change24h: 0.01,
    balance: 0,
    balanceUSD: 0,
    network: 'ERC20',
    logo: '₮'
  },
  {
    id: 'usdc-erc20',
    name: 'USD Coin ERC20',
    symbol: 'USDC-ERC20',
    price: 1.00,
    change24h: 0.00,
    balance: 0,
    balanceUSD: 0,
    network: 'ERC20',
    logo: '$'
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 43250.00,
    change24h: 2.15,
    balance: 0,
    balanceUSD: 0,
    network: 'Bitcoin',
    logo: '₿'
  },
  {
    id: 'tether-trc20',
    name: 'Tether TRC20',
    symbol: 'USDT_TRON',
    price: 1.00,
    change24h: 0.01,
    balance: 0,
    balanceUSD: 0,
    network: 'TRC20',
    logo: '₮'
  },
];

// Empty transactions array since we'll load from the database
export const mockTransactions = [];
