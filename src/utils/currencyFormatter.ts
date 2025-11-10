
export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getCurrencySymbol = (currency: string): string => {
  const symbols: { [key: string]: string } = {
    USD: '$',
    CAD: 'C$',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
  };
  return symbols[currency] || '$';
};

export const getSupportedCurrencies = (): Array<{ code: string; name: string; symbol: string }> => {
  return [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' }
  ];
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string, exchangeRates: { [key: string]: number }): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first if not already USD
  let usdAmount = amount;
  if (fromCurrency !== 'USD') {
    usdAmount = amount / (exchangeRates[fromCurrency] || 1);
  }
  
  // Convert from USD to target currency
  if (toCurrency === 'USD') {
    return usdAmount;
  }
  
  return usdAmount * (exchangeRates[toCurrency] || 1);
};
