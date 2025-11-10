// Enhanced input validation utilities for security

export class InputValidator {
  // Email validation with enhanced security checks
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Check for suspicious patterns
    if (email.length > 320) { // RFC 5321 limit
      return { isValid: false, error: 'Email address too long' };
    }

    // Check for potentially malicious characters
    const suspiciousChars = /[<>\"'&]/;
    if (suspiciousChars.test(email)) {
      return { isValid: false, error: 'Email contains invalid characters' };
    }

    return { isValid: true };
  }

  // Password validation with security requirements
  static validatePassword(password: string): { isValid: boolean; error?: string; strength?: string } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    if (password.length > 128) {
      return { isValid: false, error: 'Password is too long' };
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123', 
      'password123', 'admin', 'letmein', 'welcome', '1234567890'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      return { isValid: false, error: 'Password is too common' };
    }

    // Calculate strength
    let strength = 'weak';
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (criteriaCount >= 3 && password.length >= 12) {
      strength = 'strong';
    } else if (criteriaCount >= 2 && password.length >= 10) {
      strength = 'medium';
    }

    return { isValid: true, strength };
  }

  // Seed phrase validation
  static validateSeedPhrase(phrase: string): { isValid: boolean; error?: string } {
    if (!phrase || typeof phrase !== 'string') {
      return { isValid: false, error: 'Seed phrase is required' };
    }

    const words = phrase.trim().split(/\s+/);
    
    if (words.length !== 12) {
      return { isValid: false, error: 'Seed phrase must contain exactly 12 words' };
    }

    // Check for empty words
    if (words.some(word => !word || word.length < 2)) {
      return { isValid: false, error: 'All words in seed phrase must be valid' };
    }

    // Check for suspicious characters in words
    const wordRegex = /^[a-zA-Z]+$/;
    if (words.some(word => !wordRegex.test(word))) {
      return { isValid: false, error: 'Seed phrase words can only contain letters' };
    }

    return { isValid: true };
  }

  // General text sanitization
  static sanitizeText(text: string, maxLength: number = 1000): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .substring(0, maxLength)
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  // Wallet address validation
  static validateWalletAddress(address: string, asset: string): { isValid: boolean; error?: string } {
    if (!address || typeof address !== 'string') {
      return { isValid: false, error: 'Wallet address is required' };
    }

    // Basic format checks based on asset type
    switch (asset.toUpperCase()) {
      case 'ETH':
      case 'USDT':
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
          return { isValid: false, error: 'Invalid Ethereum address format' };
        }
        break;
      default:
        // Basic alphanumeric check for unknown assets
        if (!/^[a-zA-Z0-9]{20,80}$/.test(address)) {
          return { isValid: false, error: 'Invalid wallet address format' };
        }
    }

    return { isValid: true };
  }

  // Amount validation for transactions
  static validateAmount(amount: string | number): { isValid: boolean; error?: string; value?: number } {
    if (amount === null || amount === undefined || amount === '') {
      return { isValid: false, error: 'Amount is required' };
    }

    const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numValue)) {
      return { isValid: false, error: 'Amount must be a valid number' };
    }

    if (numValue <= 0) {
      return { isValid: false, error: 'Amount must be greater than zero' };
    }

    if (numValue > 999999999) {
      return { isValid: false, error: 'Amount is too large' };
    }

    // Check for reasonable decimal places (max 8 for crypto)
    const decimals = amount.toString().split('.')[1]?.length || 0;
    if (decimals > 8) {
      return { isValid: false, error: 'Too many decimal places' };
    }

    return { isValid: true, value: numValue };
  }
}