
interface BinancePriceResponse {
  symbol: string;
  price: string;
}

interface CryptoPrices {
  [key: string]: number;
}

// Map your crypto IDs to Binance trading pairs
const CRYPTO_SYMBOL_MAP: { [key: string]: string } = {
  'ethereum': 'ETHUSDT',
  'bitcoin': 'BTCUSDT',
  'tether-erc20': 'USDT',
  'usd-coin': 'USDCUSDT'
};

export const fetchLivePrices = async (): Promise<CryptoPrices> => {
  try {
    // Fetch prices for all major cryptocurrencies
    const promises = [
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT`),
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`)
    ];
    
    // Wait for all requests to complete
    const responses = await Promise.all(promises);
    
    // Check if any request failed
    if (responses.some(resp => !resp.ok)) {
      throw new Error('One or more API requests failed');
    }
    
    // Parse the JSON responses
    const prices = await Promise.all(
      responses.map(response => response.json())
    );
    
    // Convert Binance responses to our format
    const cryptoPrices: CryptoPrices = {};
    
    // Ethereum
    cryptoPrices['ethereum'] = parseFloat(prices[0].price);
    
    // Bitcoin
    cryptoPrices['bitcoin'] = parseFloat(prices[1].price);
    
    // Add fixed price for stablecoins (USDT, USDC)
    cryptoPrices['tether-erc20'] = 1.0;
    cryptoPrices['usdt-erc20'] = 1.0;
    cryptoPrices['usdt_tron'] = 1.0;
    cryptoPrices['usd-coin'] = 1.0;
    cryptoPrices['usdc-erc20'] = 1.0;
    
    // Removed verbose logging for performance
    return cryptoPrices;
  } catch (error) {
    console.error('Error fetching live prices:', error);
    // Return empty object on error - components will use fallback prices
    return {};
  }
};

export const fetchSinglePrice = async (cryptoId: string): Promise<number | null> => {
  try {
    const binanceSymbol = CRYPTO_SYMBOL_MAP[cryptoId];
    if (!binanceSymbol) {
      return null;
    }
    
    // For stablecoins (USDT, USDC), return a fixed price of 1.0
    if (cryptoId.startsWith('tether-') || cryptoId === 'usd-coin') {
      return 1.0;
    }
    
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}USDT`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: BinancePriceResponse = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching price for ${cryptoId}:`, error);
    return null;
  }
};
