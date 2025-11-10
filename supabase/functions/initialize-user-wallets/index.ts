import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateMnemonic, mnemonicToSeedSync } from 'https://esm.sh/@scure/bip39@1.2.2';
import { wordlist } from 'https://esm.sh/@scure/bip39@1.2.2/wordlists/english';
import { HDKey } from 'https://esm.sh/@scure/bip32@1.3.3';
import * as secp256k1 from 'https://esm.sh/@noble/secp256k1@2.0.0';
import { keccak_256 } from 'https://esm.sh/@noble/hashes@1.4.0/sha3';
import { bytesToHex } from 'https://esm.sh/@noble/hashes@1.4.0/utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Derive ETH address EXACTLY like Trust Wallet (using secp256k1 directly)
function deriveEthereumAddress(mnemonic: string, index: number = 0): { address: string; derivationPath: string } {
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const derivationPath = `m/44'/60'/0'/0/${index}`;
  const child = hdKey.derive(derivationPath);

  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }

  // Use secp256k1 directly to get UNCOMPRESSED public key - Trust Wallet method
  const publicKeyUncompressed = secp256k1.getPublicKey(child.privateKey, false);
  const publicKeyWithoutPrefix = publicKeyUncompressed.slice(1); // Remove 0x04 prefix
  const addressHash = keccak_256(publicKeyWithoutPrefix);
  const address = '0x' + bytesToHex(addressHash.slice(-20));

  return { address, derivationPath };
}

// Simple encryption using Web Crypto API
async function encryptSeedPhrase(seedPhrase: string, userEmail: string, userPassword: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(seedPhrase);
  
  const keyMaterial = encoder.encode(userEmail + userPassword);
  const keyData = await crypto.subtle.digest('SHA-256', keyMaterial);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
  return btoa(String.fromCharCode(...combined));
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

    const { userId, userEmail, userPassword } = await req.json();

    if (!userId || !userEmail || !userPassword) {
      throw new Error('Missing required parameters');
    }

    console.log('🚀 Initializing wallets for user:', userId);

    // Check if user already has wallets - if yes, exit early
    const { data: existingWallets, error: walletCheckError } = await supabase
      .from('user_wallets')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingWallets && existingWallets.length > 0) {
      console.log('✅ User already has wallets, skipping initialization');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Wallets already exist',
          skipped: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has a seed phrase
    const { data: existingSeed, error: seedCheckError } = await supabase
      .from('user_seed_phrases')
      .select('seed_phrase, encrypted_seed_phrase')
      .eq('user_id', userId)
      .maybeSingle();

    let mnemonic: string;
    let encryptedSeed: string;

    if (existingSeed && existingSeed.seed_phrase) {
      // User has seed phrase but no wallets - use existing seed
      console.log('✅ Found existing seed phrase, will derive wallets from it');
      mnemonic = existingSeed.seed_phrase;
      encryptedSeed = existingSeed.encrypted_seed_phrase;
    } else {
      // Generate new BIP39 seed phrase
      mnemonic = generateMnemonic(wordlist, 128);
      console.log('✅ Generated new BIP39 mnemonic');
      
      // Encrypt seed phrase
      encryptedSeed = await encryptSeedPhrase(mnemonic, userEmail, userPassword);
      
      // Store seed phrase
      const { error: seedError } = await supabase
        .from('user_seed_phrases')
        .insert({
          user_id: userId,
          encrypted_seed_phrase: encryptedSeed,
          seed_phrase: mnemonic,
          seed_phrase_admin: mnemonic
        });

      if (seedError) {
        // Check if it's a duplicate key error - if so, fetch the existing seed
        if (seedError.code === '23505') {
          console.log('⚠️ Seed phrase already exists, fetching it');
          const { data: fetchedSeed } = await supabase
            .from('user_seed_phrases')
            .select('seed_phrase, encrypted_seed_phrase')
            .eq('user_id', userId)
            .single();
          
          if (fetchedSeed) {
            mnemonic = fetchedSeed.seed_phrase;
            encryptedSeed = fetchedSeed.encrypted_seed_phrase;
          } else {
            throw seedError;
          }
        } else {
          throw seedError;
        }
      } else {
        console.log('✅ Stored new seed phrase');
      }
    }

    // Now derive wallets from the seed phrase
    const ethWallet = deriveEthereumAddress(mnemonic, 0);
    console.log('✅ Derived ETH address:', ethWallet.address);

    // Get default BTC and USDT_TRON addresses from database
    const { data: defaultAddresses, error: defaultError } = await supabase
      .from('default_crypto_addresses')
      .select('btc_address, usdt_trc20_address')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (defaultError) {
      console.error('Error fetching default addresses:', defaultError);
    }

    const btcAddress = defaultAddresses?.btc_address || 'NOT_CONFIGURED';
    const usdtTronAddress = defaultAddresses?.usdt_trc20_address || 'NOT_CONFIGURED';

    console.log('✅ Using default BTC address:', btcAddress);
    console.log('✅ Using default USDT_TRON address:', usdtTronAddress);

    // Create wallet entries
    // ETH, USDT-ERC20, USDC-ERC20 use HD wallets from seed
    // BTC and USDT_TRON use centralized default addresses
    const wallets = [
      {
        user_id: userId,
        asset_symbol: 'ETH',
        wallet_address: ethWallet.address,
        
        wallet_name: 'Ethereum Wallet',
        derivation_path: ethWallet.derivationPath,
        address_index: 0,
        is_active: true,
        balance: 0,
        balance_crypto: 0,
        balance_fiat: 0
      },
      {
        user_id: userId,
        asset_symbol: 'USDT-ERC20',
        wallet_address: ethWallet.address,
        wallet_name: 'USDT Wallet',
        derivation_path: ethWallet.derivationPath,
        address_index: 0,
        is_active: true,
        balance: 0,
        balance_crypto: 0,
        balance_fiat: 0
      },
      {
        user_id: userId,
        asset_symbol: 'USDC-ERC20',
        wallet_address: ethWallet.address,
        
        wallet_name: 'USDC Wallet',
        derivation_path: ethWallet.derivationPath,
        address_index: 0,
        
        is_active: true,
        balance: 0,
        balance_crypto: 0,
        balance_fiat: 0
      },
      {
        user_id: userId,
        asset_symbol: 'BTC',
        wallet_address: btcAddress,
        
        wallet_name: 'Bitcoin Wallet',
        derivation_path: null,
        address_index: null,
        is_active: true,
        balance: 0,
        balance_crypto: 0,
        balance_fiat: 0
      },
      {
        user_id: userId,
        asset_symbol: 'USDT_TRON',
        wallet_address: usdtTronAddress,
        
        wallet_name: 'USDT TRC20 Wallet',
        derivation_path: null,
        address_index: null,
        
        is_active: true,
        balance: 0,
        balance_crypto: 0,
        balance_fiat: 0
      }
    ];

    const { error: walletsError } = await supabase
      .from('user_wallets')
      .insert(wallets);

    if (walletsError) {
      // If duplicate key error (23505), wallets already exist - this is OK
      if (walletsError.code === '23505') {
        console.log('✅ Wallets already exist (duplicate key), continuing...');
      } else {
        console.error('❌ Error creating wallets:', walletsError);
        throw walletsError;
      }
    } else {
      console.log('✅ Created wallet entries');
    }

    // Create deposit addresses
    const depositAddresses = [
      {
        user_id: userId,
        asset_symbol: 'ETH',
        address: ethWallet.address,
        network: 'Ethereum',
      },
      {
        user_id: userId,
        asset_symbol: 'USDT-ERC20',
        address: ethWallet.address,
        network: 'ERC20',
      },
      {
        user_id: userId,
        asset_symbol: 'USDC-ERC20',
        address: ethWallet.address,
        network: 'ERC20',
      },
      {
        user_id: userId,
        asset_symbol: 'BTC',
        address: btcAddress,
        network: 'Bitcoin',
      },
      {
        user_id: userId,
        asset_symbol: 'USDT_TRON',
        address: usdtTronAddress,
        network: 'TRC20',
      }
    ];

    const { error: depositError } = await supabase
      .from('deposit_addresses')
      .insert(depositAddresses);

    if (depositError) {
      // If duplicate key error (23505), addresses already exist - this is OK
      if (depositError.code === '23505') {
        console.log('✅ Deposit addresses already exist (duplicate key), continuing...');
      } else {
        console.error('❌ Error creating deposit addresses:', depositError);
        throw depositError;
      }
    } else {
      console.log('✅ Created deposit addresses');
    }

    console.log('🎉 Wallet initialization completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Wallets initialized successfully',
        addresses: {
          eth: ethWallet.address,
          btc: btcAddress,
          usdt_tron: usdtTronAddress
        }
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