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

// Derive ETH address from seed phrase
function deriveEthereumAddress(mnemonic: string, index: number = 0): { address: string; derivationPath: string } {
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const derivationPath = `m/44'/60'/0'/0/${index}`;
  const child = hdKey.derive(derivationPath);

  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }

  const publicKeyUncompressed = secp256k1.getPublicKey(child.privateKey, false);
  const publicKeyWithoutPrefix = publicKeyUncompressed.slice(1);
  const addressHash = keccak_256(publicKeyWithoutPrefix);
  const address = '0x' + bytesToHex(addressHash.slice(-20));

  return { address, derivationPath };
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

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Missing userId parameter');
    }

    console.log('🚀 Admin initializing wallets for user:', userId);

    // Check if user already has wallets
    const { data: existingWallets } = await supabase
      .from('user_wallets')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingWallets && existingWallets.length > 0) {
      console.log('✅ User already has wallets');
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
    const { data: existingSeed } = await supabase
      .from('user_seed_phrases')
      .select('seed_phrase_admin')
      .eq('user_id', userId)
      .maybeSingle();

    let mnemonic: string;

    if (existingSeed?.seed_phrase_admin) {
      console.log('✅ Using existing seed phrase');
      mnemonic = existingSeed.seed_phrase_admin;
    } else {
      // Generate new seed phrase
      mnemonic = generateMnemonic(wordlist, 128);
      console.log('✅ Generated new seed phrase');
      
      // Store seed phrase (admin only version)
      const { error: seedError } = await supabase
        .from('user_seed_phrases')
        .insert({
          user_id: userId,
          seed_phrase_admin: mnemonic,
          encrypted_seed_phrase: 'admin-generated'
        });

      if (seedError && seedError.code !== '23505') {
        throw seedError;
      }
      console.log('✅ Stored seed phrase');
    }

    // Derive ETH address
    const ethWallet = deriveEthereumAddress(mnemonic, 0);
    console.log('✅ Derived ETH address:', ethWallet.address);

    // Get default BTC and USDT_TRON addresses
    const { data: defaultAddresses } = await supabase
      .from('default_crypto_addresses')
      .select('btc_address, usdt_trc20_address')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const btcAddress = defaultAddresses?.btc_address || 'NOT_CONFIGURED';
    const usdtTronAddress = defaultAddresses?.usdt_trc20_address || 'NOT_CONFIGURED';

    // Create wallet entries
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

    if (walletsError && walletsError.code !== '23505') {
      throw walletsError;
    }
    console.log('✅ Created wallet entries');

    // Create deposit addresses
    const depositAddresses = [
      { user_id: userId, asset_symbol: 'ETH', address: ethWallet.address, network: 'Ethereum' },
      { user_id: userId, asset_symbol: 'USDT-ERC20', address: ethWallet.address, network: 'ERC20' },
      { user_id: userId, asset_symbol: 'USDC-ERC20', address: ethWallet.address, network: 'ERC20' },
      { user_id: userId, asset_symbol: 'BTC', address: btcAddress, network: 'Bitcoin' },
      { user_id: userId, asset_symbol: 'USDT_TRON', address: usdtTronAddress, network: 'TRC20' }
    ];

    const { error: depositError } = await supabase
      .from('deposit_addresses')
      .insert(depositAddresses);

    if (depositError && depositError.code !== '23505') {
      throw depositError;
    }
    console.log('✅ Created deposit addresses');

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
