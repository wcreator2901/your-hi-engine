import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode, decode } from "https://deno.land/std@0.190.0/encoding/base32.ts";

// Use Web Crypto API for HMAC instead of external dependency
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = new Uint8Array(key);
  const messageBuffer = new Uint8Array(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
  return new Uint8Array(signature);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TOTPRequest {
  action: 'generate' | 'verify' | 'enable' | 'disable' | 'backup-codes';
  token?: string;
  secret?: string;
}

// TOTP Configuration
const TOTP_WINDOW = 30; // 30 seconds window
const TOTP_DIGITS = 6;
const TOTP_TOLERANCE = 1; // Allow 1 window before/after current

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const encryptionKey = Deno.env.get('ENCRYPTION_SECRET_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple encryption/decryption using Web Crypto API
async function encrypt(text: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const keyData = encoder.encode(key.slice(0, 32).padEnd(32, '0'));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...result));
}

async function decrypt(encryptedText: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key.slice(0, 32).padEnd(32, '0'));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const data = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

// Generate random base32 secret
function generateSecret(): string {
  const buffer = new Uint8Array(20);
  crypto.getRandomValues(buffer);
  return encode(buffer).replace(/=/g, '');
}

// Generate TOTP token
async function generateTOTP(secret: string, time?: number): Promise<string> {
  const timeStep = Math.floor((time || Date.now()) / 1000 / TOTP_WINDOW);
  const timeBytes = new ArrayBuffer(8);
  const timeView = new DataView(timeBytes);
  timeView.setUint32(4, timeStep, false);
  
  const secretBytes = decode(secret);
  const hmacResult = await hmacSha1(secretBytes, new Uint8Array(timeBytes));
  
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code = (
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)
  ) % Math.pow(10, TOTP_DIGITS);
  
  return code.toString().padStart(TOTP_DIGITS, '0');
}

// Verify TOTP token
async function verifyTOTP(secret: string, token: string, time?: number): Promise<boolean> {
  const currentTime = time || Date.now();
  
  for (let i = -TOTP_TOLERANCE; i <= TOTP_TOLERANCE; i++) {
    const testTime = currentTime + (i * TOTP_WINDOW * 1000);
    const expectedToken = await generateTOTP(secret, testTime);
    if (expectedToken === token) {
      return true;
    }
  }
  
  return false;
}

// Generate backup codes
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

// Hash backup codes for secure storage
async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashedCodes: string[] = [];
  for (const code of codes) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    hashedCodes.push(hashHex);
  }
  return hashedCodes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, token, secret }: TOTPRequest = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Set auth header for supabase client
    const userResponse = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userResponse.error || !userResponse.data.user) {
      throw new Error('Invalid user token');
    }

    const userId = userResponse.data.user.id;

    switch (action) {
      case 'generate': {
        // Generate new TOTP secret and QR code data
        const newSecret = generateSecret();
        const encryptedSecret = await encrypt(newSecret, encryptionKey);
        
        // Create or update 2FA record (but don't enable yet)
        const { error } = await supabase
          .from('user_2fa')
          .upsert({
            user_id: userId,
            secret_encrypted: encryptedSecret,
            is_enabled: false,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        // Generate QR code URI
        const userEmail = userResponse.data.user.email;
        const issuer = 'BitShield';
        const qrUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(userEmail || 'user')}?secret=${newSecret}&issuer=${encodeURIComponent(issuer)}`;

        return new Response(JSON.stringify({
          secret: newSecret,
          qrUri: qrUri
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'verify': {
        if (!token) {
          throw new Error('Token required for verification');
        }

        console.log(`Verifying TOTP for user ${userId} with token ${token}`);

        // Get user's 2FA secret
        const { data: twoFAData, error } = await supabase
          .from('user_2fa')
          .select('secret_encrypted')
          .eq('user_id', userId)
          .single();

        if (error || !twoFAData) {
          console.error('2FA data not found:', error);
          throw new Error('2FA not set up for this user');
        }

        console.log('Found 2FA data, decrypting secret...');
        const decryptedSecret = await decrypt(twoFAData.secret_encrypted, encryptionKey);
        console.log(`Decrypted secret length: ${decryptedSecret.length}`);
        
        // Generate current expected token for debugging
        const currentTime = Date.now();
        const expectedToken = await generateTOTP(decryptedSecret, currentTime);
        console.log(`Current time: ${currentTime}, Expected token: ${expectedToken}, Received token: ${token}`);
        
        const isValid = await verifyTOTP(decryptedSecret, token);
        console.log(`TOTP verification result: ${isValid}`);

        return new Response(JSON.stringify({ valid: isValid }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'enable': {
        if (!token) {
          throw new Error('Token required to enable 2FA');
        }

        // Verify token first
        const { data: twoFAData, error: fetchError } = await supabase
          .from('user_2fa')
          .select('secret_encrypted')
          .eq('user_id', userId)
          .single();

        if (fetchError || !twoFAData) {
          throw new Error('2FA not set up for this user');
        }

        const decryptedSecret = await decrypt(twoFAData.secret_encrypted, encryptionKey);
        const isValid = await verifyTOTP(decryptedSecret, token);

        if (!isValid) {
          throw new Error('Invalid token');
        }

        // Generate backup codes
        const backupCodes = generateBackupCodes();
        const hashedBackupCodes = await hashBackupCodes(backupCodes);

        // Enable 2FA
        const { error: updateError } = await supabase
          .from('user_2fa')
          .update({
            is_enabled: true,
            backup_codes: hashedBackupCodes,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
          enabled: true,
          backupCodes: backupCodes // Return unhashed codes for user to save
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'disable': {
        if (!token) {
          throw new Error('Token required to disable 2FA');
        }

        // Verify token first
        const { data: twoFAData, error: fetchError } = await supabase
          .from('user_2fa')
          .select('secret_encrypted, is_enabled')
          .eq('user_id', userId)
          .single();

        if (fetchError || !twoFAData || !twoFAData.is_enabled) {
          throw new Error('2FA not enabled for this user');
        }

        const decryptedSecret = await decrypt(twoFAData.secret_encrypted, encryptionKey);
        const isValid = await verifyTOTP(decryptedSecret, token);

        if (!isValid) {
          throw new Error('Invalid token');
        }

        // Disable 2FA
        const { error: updateError } = await supabase
          .from('user_2fa')
          .update({
            is_enabled: false,
            backup_codes: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ disabled: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'backup-codes': {
        // Get current 2FA status
        const { data: twoFAData, error: fetchError } = await supabase
          .from('user_2fa')
          .select('is_enabled')
          .eq('user_id', userId)
          .single();

        if (fetchError || !twoFAData || !twoFAData.is_enabled) {
          throw new Error('2FA not enabled for this user');
        }

        // Generate new backup codes
        const backupCodes = generateBackupCodes();
        const hashedBackupCodes = await hashBackupCodes(backupCodes);

        // Update backup codes
        const { error: updateError } = await supabase
          .from('user_2fa')
          .update({
            backup_codes: hashedBackupCodes,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({
          backupCodes: backupCodes
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('Error in totp-2fa function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});