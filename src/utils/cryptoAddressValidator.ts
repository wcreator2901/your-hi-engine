
// Crypto address validation utility
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateCryptoAddress = (address: string, symbol: string): ValidationResult => {
  if (!address || !address.trim()) {
    return { isValid: false, error: 'Address is required' };
  }

  const trimmedAddress = address.trim();

  switch (symbol.toUpperCase()) {
    case 'ETH':
      return validateEthereumAddress(trimmedAddress);
    case 'USDT':
    case 'USDT-ERC20':
      return validateEthereumAddress(trimmedAddress);
    case 'USDC':
    case 'USDC-ERC20':
      return validateEthereumAddress(trimmedAddress);
    case 'BTC':
      return validateBitcoinAddress(trimmedAddress);
    case 'USDT-TRC20':
    case 'USDT_TRON':
      return validateTronAddress(trimmedAddress);
    default:
      return { isValid: false, error: 'Unsupported cryptocurrency' };
  }
};


const validateEthereumAddress = (address: string): ValidationResult => {
  // Ethereum address pattern (0x + 40 hex characters)
  const ethPattern = /^0x[a-fA-F0-9]{40}$/;
  
  if (ethPattern.test(address)) {
    return { isValid: true };
  }
  
  return { isValid: false, error: 'Invalid Ethereum address format' };
};

const validateBitcoinAddress = (address: string): ValidationResult => {
  // Bitcoin address patterns (Legacy, SegWit, Native SegWit)
  const btcLegacyPattern = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const btcSegWitPattern = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const btcNativeSegWitPattern = /^bc1[a-z0-9]{39,59}$/;
  
  if (btcLegacyPattern.test(address) || btcSegWitPattern.test(address) || btcNativeSegWitPattern.test(address)) {
    return { isValid: true };
  }
  
  return { isValid: false, error: 'Invalid Bitcoin address format' };
};

const validateTronAddress = (address: string): ValidationResult => {
  // TRON address pattern (T + 33 base58 characters)
  const tronPattern = /^T[a-km-zA-HJ-NP-Z1-9]{33}$/;
  
  if (tronPattern.test(address)) {
    return { isValid: true };
  }
  
  return { isValid: false, error: 'Invalid TRON address format' };
};


export const getNetworkFee = (symbol: string): number => {
  // Network fees in the respective cryptocurrency
  switch (symbol.toUpperCase()) {
    case 'ETH':
      return 0.002;
    case 'USDT':
    case 'USDT-ERC20':
      return 0.002; // ERC-20 fees
    case 'USDC':
    case 'USDC-ERC20':
      return 0.002; // ERC-20 fees
    case 'BTC':
      return 0.0001; // Bitcoin network fee
    case 'USDT-TRC20':
    case 'USDT_TRON':
      return 1; // TRON network fee (in TRX, but represented in USDT for simplicity)
    default:
      return 0.001;
  }
};
