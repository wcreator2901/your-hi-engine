import { ethers } from 'ethers';
import * as bip39 from '@scure/bip39';
import { HDKey } from '@scure/bip32';
import { wordlist } from '@scure/bip39/wordlists/english';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { keccak_256 as keccak256 } from '@noble/hashes/sha3';
import { bech32 } from '@scure/base';
import * as secp256k1 from '@noble/secp256k1';

// Interfaces for wallet data
export interface HDWalletAddress {
  asset: string;
  address: string;
  derivationPath: string;
  addressIndex: number;
}

export interface HDWalletData {
  mnemonic: string;
  addresses: HDWalletAddress[];
}

// Derivation paths used by Trust Wallet
export const DERIVATION_PATHS = {
  ETH: "m/44'/60'/0'/0",     // Ethereum - Trust Wallet standard  
  'USDT-ERC20': "m/44'/60'/0'/0", // Same as ETH for ERC20 tokens
  BTC: "m/84'/0'/0'/0",      // Bitcoin - Native SegWit (Bech32)
  'USDT-TRC20': "m/44'/195'/0'/0" // TRON network
};

/**
 * Generate a new 12-word BIP39 mnemonic phrase
 */
export function generateMnemonic(): string {
  return bip39.generateMnemonic(wordlist, 128); // 128 bits = 12 words
}

/**
 * Validate a BIP39 mnemonic phrase
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic, wordlist);
}

/**
 * Create HD wallet from mnemonic
 */
export function createHDWalletFromMnemonic(mnemonic: string): HDKey {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  return HDKey.fromMasterSeed(seed);
}


/**
 * Derive Ethereum address using EXACT Trust Wallet derivation
 */
export function deriveEthereumAddress(mnemonic: string, addressIndex: number = 0): HDWalletAddress {
  const derivationPath = `${DERIVATION_PATHS.ETH}/${addressIndex}`;
  
  try {
    // Use HDKey for EXACT Trust Wallet compatibility 
    const root = createHDWalletFromMnemonic(mnemonic);
    
    // Derive using EXACT Trust Wallet path
    const child = root.derive(derivationPath);
    
    if (!child.privateKey) {
      throw new Error('Failed to derive Ethereum private key');
    }
    
    // Create Ethereum address using secp256k1 directly - Trust Wallet method
    const publicKeyUncompressed = secp256k1.getPublicKey(child.privateKey, false);
    const publicKeyWithoutPrefix = publicKeyUncompressed.slice(1); // Remove 0x04 prefix
    const addressHash = keccak256(publicKeyWithoutPrefix);
    const address = '0x' + Array.from(addressHash.slice(-20))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return {
      asset: 'ETH',
      address,
      derivationPath,
      addressIndex
    };
  } catch (error) {
    console.error('Error deriving Ethereum address:', error);
    throw error;
  }
}

/**
 * Derive USDT-ERC20 address (same as Ethereum)
 */
export function deriveUSDTERC20Address(mnemonic: string, addressIndex: number = 0): HDWalletAddress {
  const ethAddress = deriveEthereumAddress(mnemonic, addressIndex);
  return {
    ...ethAddress,
    asset: 'USDT-ERC20'
  };
}


/**
 * Derive Bitcoin address using Native SegWit (Bech32)
 */
export function deriveBitcoinAddress(mnemonic: string, addressIndex: number = 0): HDWalletAddress {
  const derivationPath = `${DERIVATION_PATHS.BTC}/${addressIndex}`;
  
  try {
    const root = createHDWalletFromMnemonic(mnemonic);
    const child = root.derive(derivationPath);
    
    if (!child.privateKey) {
      throw new Error('Failed to derive Bitcoin private key');
    }
    
    // Generate public key
    const publicKey = secp256k1.getPublicKey(child.privateKey, true);
    
    // Create witness program (P2WPKH)
    const pubKeyHash = ripemd160(sha256(publicKey));
    
    // Bech32 encoding for native SegWit
    const words = bech32.toWords(pubKeyHash);
    const address = bech32.encode('bc', [0, ...words]);
    
    return {
      asset: 'BTC',
      address,
      derivationPath,
      addressIndex
    };
  } catch (error) {
    console.error('Error deriving Bitcoin address:', error);
    throw error;
  }
}

/**
 * Derive USDT-TRC20 address (TRON network)
 */
export function deriveUSDTTRC20Address(mnemonic: string, addressIndex: number = 0): HDWalletAddress {
  const derivationPath = `${DERIVATION_PATHS['USDT-TRC20']}/${addressIndex}`;
  
  try {
    const root = createHDWalletFromMnemonic(mnemonic);
    const child = root.derive(derivationPath);
    
    if (!child.privateKey) {
      throw new Error('Failed to derive TRON private key');
    }
    
    // Generate public key
    const publicKey = secp256k1.getPublicKey(child.privateKey, false);
    const publicKeyWithoutPrefix = publicKey.slice(1);
    
    // TRON uses Keccak256 hash
    const hash = keccak256(publicKeyWithoutPrefix);
    const addressBytes = hash.slice(-20);
    
    // Add TRON prefix (0x41 for mainnet)
    const addressWithPrefix = new Uint8Array(21);
    addressWithPrefix[0] = 0x41;
    addressWithPrefix.set(addressBytes, 1);
    
    // Base58 encode with checksum
    const address = base58EncodeWithChecksum(addressWithPrefix);
    
    return {
      asset: 'USDT-TRC20',
      address,
      derivationPath,
      addressIndex
    };
  } catch (error) {
    console.error('Error deriving TRON address:', error);
    throw error;
  }
}

/**
 * Base58 encoding with checksum for TRON addresses
 */
function base58EncodeWithChecksum(payload: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  
  // Add checksum
  const hash1 = sha256(payload);
  const hash2 = sha256(hash1);
  const checksum = hash2.slice(0, 4);
  
  const fullPayload = new Uint8Array(payload.length + checksum.length);
  fullPayload.set(payload);
  fullPayload.set(checksum, payload.length);
  
  // Convert to base58
  let num = BigInt('0x' + Array.from(fullPayload).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  if (num === 0n) {
    return alphabet[0];
  }
  
  let result = '';
  while (num > 0n) {
    result = alphabet[Number(num % 58n)] + result;
    num = num / 58n;
  }
  
  // Add leading zeros
  for (let i = 0; i < fullPayload.length && fullPayload[i] === 0; i++) {
    result = alphabet[0] + result;
  }
  
  return result;
}

/**
 * Generate a new HD wallet with all addresses
 */
export function generateHDWallet(addressIndex: number = 0): HDWalletData {
  const mnemonic = generateMnemonic();
  const addresses = generateAddressesFromMnemonic(mnemonic, addressIndex);
  
  return {
    mnemonic,
    addresses
  };
}

/**
 * Generate all addresses from an existing mnemonic
 */
export function generateAddressesFromMnemonic(mnemonic: string, addressIndex: number = 0): HDWalletAddress[] {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }
  
  return [
    deriveEthereumAddress(mnemonic, addressIndex),
    deriveUSDTERC20Address(mnemonic, addressIndex),
    deriveBitcoinAddress(mnemonic, addressIndex),
    deriveUSDTTRC20Address(mnemonic, addressIndex)
  ];
}

/**
 * Validate address format for different assets
 */
export function validateAddressFormat(address: string, asset: string): boolean {
  try {
    switch (asset.toUpperCase()) {
      case 'ETH':
      case 'USDT-ERC20':
        // Ethereum addresses are 42 characters, start with 0x
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      
      case 'BTC':
        // Bitcoin Bech32 addresses start with bc1
        return /^bc1[a-z0-9]{39,59}$/.test(address);
      
      case 'USDT-TRC20':
        // TRON addresses start with T and are 34 characters
        return /^T[a-zA-Z0-9]{33}$/.test(address);
      
      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Test Trust Wallet compatibility
 */
export function testTrustWalletCompatibility(mnemonic: string): void {
  console.log('🧪 Testing Trust Wallet compatibility...');
  
  try {
    const addresses = generateAddressesFromMnemonic(mnemonic);
    
    console.log('✅ Generated addresses:');
    addresses.forEach(addr => {
      console.log(`  ${addr.asset}: ${addr.address}`);
      console.log(`    Path: ${addr.derivationPath}`);
    });
    
  } catch (error) {
    console.error('❌ Trust Wallet compatibility test failed:', error);
  }
}

/**
 * Test specific seed phrase for verification
 */
export function testSpecificSeed(): void {
  const testMnemonic = "news call solid spoil nature orbit nephew soda citizen pitch unveil quick";
  console.log('=== Testing Specific Seed Phrase ===');
  
  if (!validateMnemonic(testMnemonic)) {
    console.error('Invalid mnemonic provided');
    return;
  }
  
  const ethAddress = deriveEthereumAddress(testMnemonic, 0);
  console.log('ETH Address for test seed:', ethAddress.address);
}

/**
 * Redact sensitive data for logging
 */
export function redactSensitiveData(data: any): any {
  if (typeof data === 'string') {
    // Redact mnemonic phrases (12 or 24 words)
    const words = data.split(' ');
    if (words.length === 12 || words.length === 24) {
      return `[REDACTED_MNEMONIC_${words.length}_WORDS]`;
    }
  }
  
  if (typeof data === 'object' && data !== null) {
    const redacted = { ...data };
    
    // Redact known sensitive fields
    const sensitiveFields = ['mnemonic', 'seed', 'privateKey', 'seedPhrase'];
    
    for (const field of sensitiveFields) {
      if (redacted[field]) {
        redacted[field] = '[REDACTED]';
      }
    }
    
    return redacted;
  }
  
  return data;
}