import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Trust Wallet EXACT derivation paths
const DERIVATION_PATHS = {
  BTC: "m/84'/0'/0'/0", // Native SegWit (bech32) - BIP 84
  ETH: "m/44'/60'/0'/0", // Ethereum standard
  'USDT-ERC20': "m/44'/60'/0'/0", // Same as ETH
  'USDT-TRC20': "m/44'/195'/0'/0", // TRON network
} as const;

// Import proper crypto libraries for Deno
import { HDKey } from "npm:@scure/bip32@1.3.3";
import * as bip39 from "npm:@scure/bip39@1.2.2";
import { wordlist } from "npm:@scure/bip39@1.2.2/wordlists/english";
import { sha256 } from "npm:@noble/hashes@1.4.0/sha256";
import { ripemd160 } from "npm:@noble/hashes@1.4.0/ripemd160";
import { keccak_256 } from "npm:@noble/hashes@1.4.0/sha3";
import { bech32 } from "npm:@scure/base@1.1.5";
import * as secp256k1 from "npm:@noble/secp256k1@2.0.0";

// Base58 encoding for TRON addresses
function base58EncodeWithChecksum(payload: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  
  // Double SHA256 checksum
  const firstHash = sha256(payload);
  const secondHash = sha256(firstHash);
  const checksum = secondHash.slice(0, 4);
  
  // Combine payload with checksum
  const combined = new Uint8Array(payload.length + checksum.length);
  combined.set(payload);
  combined.set(checksum, payload.length);
  
  // Convert to BigInt
  let num = 0n;
  for (let i = 0; i < combined.length; i++) {
    num = num * 256n + BigInt(combined[i]);
  }
  
  // Convert to base58
  let result = '';
  while (num > 0) {
    const remainder = Number(num % 58n);
    result = ALPHABET[remainder] + result;
    num = num / 58n;
  }
  
  // Add leading zeros
  for (let i = 0; i < combined.length && combined[i] === 0; i++) {
    result = ALPHABET[0] + result;
  }
  
  return result;
}

// HD wallet creation using exact Trust Wallet method
function createHDWalletFromMnemonic(mnemonic: string): HDKey {
  if (!bip39.validateMnemonic(mnemonic, wordlist)) {
    throw new Error('Invalid mnemonic phrase');
  }
  
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  return HDKey.fromMasterSeed(seed);
}

function generateTrustWalletAddress(mnemonic: string, asset: string, addressIndex: number = 0): { address: string; derivationPath: string } {
  const derivationPath = DERIVATION_PATHS[asset as keyof typeof DERIVATION_PATHS] || DERIVATION_PATHS.ETH;
  const fullPath = `${derivationPath}/${addressIndex}`;
  
  // Create HD wallet from mnemonic
  const root = createHDWalletFromMnemonic(mnemonic);
  
  // Derive the key
  const child = root.derive(fullPath);
  
  if (!child.privateKey) {
    throw new Error(`Failed to derive private key for ${asset}`);
  }
  
  switch (asset) {
    case 'BTC': {
      // BIP 84 compliant Bitcoin address generation
      const compressedPublicKey = secp256k1.getPublicKey(child.privateKey, true);
      
      // Create P2WPKH address hash: SHA256(compressed_pubkey) then RIPEMD160
      const sha256Hash = sha256(compressedPublicKey);
      const publicKeyHash = ripemd160(sha256Hash);
      
      // Encode as bech32 with 'bc' prefix for mainnet
      const words = bech32.toWords(publicKeyHash);
      const address = bech32.encode('bc', words);
      return { address, derivationPath: fullPath };
    }
      
    case 'ETH':
    case 'USDT-ERC20': {
      // Ethereum address generation
      const publicKeyUncompressed = secp256k1.getPublicKey(child.privateKey, false);
      const publicKeyWithoutPrefix = publicKeyUncompressed.slice(1);
      const addressHash = keccak_256(publicKeyWithoutPrefix);
      const address = '0x' + Array.from(addressHash.slice(-20))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return { address, derivationPath: fullPath };
    }
      
    case 'USDT-TRC20': {
      // TRON address generation
      const publicKeyUncompressed = secp256k1.getPublicKey(child.privateKey, false);
      const publicKeyWithoutPrefix = publicKeyUncompressed.slice(1);
      const addressHash = keccak_256(publicKeyWithoutPrefix);
      
      // Add TRON prefix (0x41)
      const addressBytes = new Uint8Array(21);
      addressBytes[0] = 0x41;
      addressBytes.set(addressHash.slice(-20), 1);
      
      const address = base58EncodeWithChecksum(addressBytes);
      return { address, derivationPath: fullPath };
    }
      
    default:
      throw new Error(`Unsupported asset: ${asset}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

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

    // Check if user is admin
    const { data: adminCheck } = await supabaseClient
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the user's seed phrase from database
    const { data: seedData, error: seedError } = await supabaseClient
      .from('user_seed_phrases')
      .select('seed_phrase_admin')
      .eq('user_id', userId)
      .single();

    if (seedError || !seedData) {
      return new Response(
        JSON.stringify({ error: 'Seed phrase not found for user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const seedPhrase = seedData.seed_phrase_admin;

    // Generate EXACT Trust Wallet compatible addresses
    const assets = ['BTC', 'ETH', 'USDT-ERC20', 'USDT-TRC20'];
    const generatedAddresses = [];
    
    console.log(`🧪 Generating Trust Wallet addresses for user ${userId}`);
    console.log(`Seed phrase: ${seedPhrase}`);
    
    for (const asset of assets) {
      const result = generateTrustWalletAddress(seedPhrase, asset, 0);
      console.log(`✅ ${asset}: ${result.address}`);
      
      generatedAddresses.push({
        asset,
        address: result.address,
        derivationPath: result.derivationPath
      });
    }

    // CRITICAL: This function is DEPRECATED and should NOT be used
    // It overwrites BTC and USDT_TRON addresses which should use centralized defaults
    // Only update ETH-based HD wallet addresses from seed
    console.warn('⚠️ WARNING: update-user-addresses is deprecated. Use restore-user-addresses instead.');
    
    // Only update ETH, USDT-ERC20, USDC-ERC20 (HD wallets from seed)
    // NEVER update BTC or USDT_TRON (they use centralized defaults)
    const ethBasedAssets = ['ETH', 'USDT-ERC20', 'USDC-ERC20'];
    const ethAddresses = generatedAddresses.filter(addr => ethBasedAssets.includes(addr.asset));

    for (const addrData of ethAddresses) {
      const { error: updateError } = await supabaseClient
        .from('user_wallets')
        .update({ 
          wallet_address: addrData.address,
          derivation_path: addrData.derivationPath,
          is_hd_wallet: true
        })
        .eq('user_id', userId)
        .eq('asset_symbol', addrData.asset);

      if (updateError) {
        console.error(`Error updating wallet for ${addrData.asset}:`, updateError);
      }
    }

    // Update deposit_addresses table (ETH-based only)
    for (const addrData of ethAddresses) {
      const { error: updateError } = await supabaseClient
        .from('deposit_addresses')
        .update({ 
          address: addrData.address
        })
        .eq('user_id', userId)
        .eq('asset_symbol', addrData.asset);

      if (updateError) {
        console.error(`Error updating deposit address for ${addrData.asset}:`, updateError);
      }
    }

    console.log('⚠️ Note: BTC and USDT_TRON addresses were NOT updated (they use centralized defaults)');

    return new Response(
      JSON.stringify({ 
        success: true,
        userId,
        generatedAddresses,
        message: 'User addresses updated with EXACT Trust Wallet compatibility'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in update-user-addresses function:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error?.message || 'Unknown error'}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})