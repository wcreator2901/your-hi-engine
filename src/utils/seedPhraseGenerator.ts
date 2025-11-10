import { generateMnemonic as generateBIP39Mnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

/**
 * Generates a cryptographically secure 12-word BIP39 mnemonic
 * Compatible with Trust Wallet and all BIP39-compliant wallets
 * Uses proper entropy (128 bits) and includes checksum
 */
export function generateSeedPhrase(): string[] {
  // Generate proper BIP39 mnemonic with 128 bits of entropy (12 words)
  const mnemonic = generateBIP39Mnemonic(wordlist, 128);
  return mnemonic.split(' ');
}

/**
 * Formats a seed phrase array into a space-separated string
 */
export function formatSeedPhrase(words: string[]): string {
  return words.join(' ');
}

/**
 * Validates if a phrase is a valid BIP39 seed phrase with proper checksum
 */
export function validateSeedPhrase(phrase: string): boolean {
  const normalized = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
  return validateMnemonic(normalized, wordlist);
}

/**
 * Parses a seed phrase string into an array of words
 */
export function parseSeedPhrase(phrase: string): string[] {
  return phrase
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 0);
}
