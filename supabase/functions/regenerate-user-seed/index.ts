import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateMnemonic } from 'https://esm.sh/@scure/bip39@1.2.2';
import { wordlist } from 'https://esm.sh/@scure/bip39@1.2.2/wordlists/english';
import { HDKey } from 'https://esm.sh/@scure/bip32@1.3.3';
import { keccak_256 } from 'https://esm.sh/@noble/hashes@1.4.0/sha3';
import { bytesToHex } from 'https://esm.sh/@noble/hashes@1.4.0/utils';
import * as CryptoJS from 'https://esm.sh/crypto-js@4.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function deriveEthereumAddress(mnemonic: string, index: number = 0): { address: string; derivationPath: string } {
  const seed = generateMnemonic(wordlist, 128);
  const hdKey = HDKey.fromMasterSeed(new TextEncoder().encode(seed));
  const derivationPath = `m/44'/60'/0'/0/${index}`;
  const child = hdKey.derive(derivationPath);
  
  if (!child.publicKey) {
    throw new Error('Failed to derive public key');
  }

  const pubKeyBytes = child.publicKey.slice(1);
  const hash = keccak_256(pubKeyBytes);
  const address = '0x' + bytesToHex(hash.slice(-20));

  return { address, derivationPath };
}

function encryptSeedPhrase(seedPhrase: string, userEmail: string, userPassword: string): string {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const saltLabel = 'bitshield_salt_v1';
  const combinedSalt = CryptoJS.enc.Utf8.parse(saltLabel).concat(salt);
  
  const key = CryptoJS.PBKDF2(
    userEmail + userPassword,
    combinedSalt,
    {
      keySize: 256 / 32,
      iterations: 100000,
      hasher: CryptoJS.algo.SHA256
    }
  );

  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const encrypted = CryptoJS.AES.encrypt(seedPhrase, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const combined = salt.concat(iv).concat(encrypted.ciphertext);
  return combined.toString(CryptoJS.enc.Base64);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: isAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const { userId, userEmail, userPassword } = await req.json();

    console.log('🔄 Regenerating seed phrase for user:', userId);

    // Generate new BIP39 seed phrase
    const mnemonic = generateMnemonic(wordlist, 128);
    const ethAddress = deriveEthereumAddress(mnemonic, 0);
    const encryptedSeed = encryptSeedPhrase(mnemonic, userEmail, userPassword);

    // Update seed phrase
    const { error: seedError } = await supabase
      .from('user_seed_phrases')
      .upsert({
        user_id: userId,
        seed_phrase_encrypted: encryptedSeed,
        seed_phrase_admin: mnemonic,
        is_generated: true
      }, {
        onConflict: 'user_id'
      });

    if (seedError) throw seedError;

    // Update HD wallet addresses
    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({ wallet_address: ethAddress.address, derivation_path: ethAddress.derivationPath })
      .eq('user_id', userId)
      .eq('is_hd_wallet', true);

    if (updateError) throw updateError;

    // Update deposit addresses
    const { error: depositError } = await supabase
      .from('deposit_addresses')
      .update({ address: ethAddress.address })
      .eq('user_id', userId)
      .in('asset_symbol', ['ETH', 'USDT-ERC20', 'USDC-ERC20']);

    if (depositError) throw depositError;

    console.log('✅ Seed phrase regenerated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        newAddress: ethAddress.address
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
