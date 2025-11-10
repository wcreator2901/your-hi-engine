
import CryptoJS from 'crypto-js';

// Note: These functions are for frontend use only. 
// The actual encryption secret is managed server-side via Supabase edge functions.

// Client-side temporary encryption (not for sensitive data)
export const encryptClientData = (text: string, userKey: string): string => {
  const encrypted = CryptoJS.AES.encrypt(text, userKey).toString();
  return encrypted;
};

export const decryptClientData = (encryptedText: string, userKey: string): string => {
  const decrypted = CryptoJS.AES.decrypt(encryptedText, userKey);
  return decrypted.toString(CryptoJS.enc.Utf8);
};

// Enhanced seed phrase encryption with unique salt per user
export const encryptSeedPhrase = (seedPhrase: string, userEmail: string, userPassword: string): string => {
  // Generate a cryptographically secure unique salt per user
  const userSalt = CryptoJS.lib.WordArray.random(256/8).toString();
  const combinedSalt = CryptoJS.SHA256(userEmail + userSalt + 'hotwallet_salt_2024').toString();
  
  // Use PBKDF2 for proper key derivation with increased iterations
  const key = CryptoJS.PBKDF2(userPassword + userEmail, combinedSalt, {
    keySize: 256/32,
    iterations: 100000 // Increased from 10,000 for better security
  }).toString();
  
  const encrypted = CryptoJS.AES.encrypt(seedPhrase, key).toString();
  
  // Return salt + encrypted data for proper decryption
  return `${userSalt}:${encrypted}`;
};

export const decryptSeedPhrase = (encryptedPhrase: string, userEmail: string, userPassword: string): string => {
  try {
    console.log('🔐 Decryption Debug - Input data:', {
      encryptedPhraseLength: encryptedPhrase.length,
      userEmail,
      passwordLength: userPassword.length,
      hasColon: encryptedPhrase.includes(':')
    });

    // Check if this is new format (with salt) or legacy format
    if (encryptedPhrase.includes(':')) {
      console.log('🔐 Using new format decryption');
      // New format: salt:encryptedData
      const [userSalt, encryptedData] = encryptedPhrase.split(':');
      console.log('🔐 Split data:', { userSaltLength: userSalt.length, encryptedDataLength: encryptedData.length });
      
      const saltOrders = [
        (label: string) => userEmail + userSalt + label,
        (label: string) => userEmail + label + userSalt,
        (label: string) => label + userEmail + userSalt,
        (label: string) => userSalt + userEmail + label,
      ];

      const tryDecrypt = (saltLabel: string, iterations: number, passphrase: string, hasher: any, orderIdx: number) => {
        const combinedSalt = CryptoJS.SHA256(saltOrders[orderIdx](saltLabel)).toString();
        const key = CryptoJS.PBKDF2(passphrase, combinedSalt, {
          keySize: 256/32,
          iterations,
          hasher,
        }).toString();
        const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
        return decrypted.toString(CryptoJS.enc.Utf8);
      };

      // Try combinations of salt labels, iteration counts, passphrase orders and hashers (new and legacy)
      const iterationOptions = [100000, 10000, 4096, 2048];
      const saltLabels = ['hotwallet_salt_2024', 'maplewallet_salt_2024', 'bitshield_salt_2024'];
      const passphrases = [userPassword + userEmail, userEmail + userPassword, userPassword, userEmail];
      const hashers = [CryptoJS.algo.SHA1, CryptoJS.algo.SHA256];
      let result = '';
      outer: for (const iters of iterationOptions) {
        for (const label of saltLabels) {
          for (const pass of passphrases) {
            for (let orderIdx = 0; orderIdx < saltOrders.length; orderIdx++) {
              for (const hasher of hashers) {
                try {
                  result = tryDecrypt(label, iters, pass, hasher, orderIdx);
                  if (result) break outer;
                } catch {}
              }
            }
          }
        }
      }

      console.log('🔐 Decryption result length:', result.length);
      if (!result) {
        throw new Error('Decryption resulted in empty string - likely wrong password or salt mismatch');
      }
      return result;
    } else {
      console.log('🔐 Using legacy format decryption');
      // Legacy format - use the original encryption method
      const key = CryptoJS.SHA256(userEmail + 'hotwallet_recovery_key').toString();
      console.log('🔐 Legacy key length:', key.length);
      
      const decrypted = CryptoJS.AES.decrypt(encryptedPhrase, key);
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      console.log('🔐 Legacy decryption result length:', result.length);
      
      if (!result) {
        throw new Error('Legacy decryption resulted in empty string - likely wrong password');
      }
      
      return result;
    }
  } catch (error) {
    console.error('🔐 Decryption error details:', error);
    throw new Error('Failed to decrypt seed phrase. Please check your password.');
  }
};

// Basic encryption/decryption functions remain for other purposes
