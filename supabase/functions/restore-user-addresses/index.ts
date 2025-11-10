import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { HDKey } from "https://esm.sh/@scure/bip32@1.3.3";
import * as bip39 from "https://esm.sh/@scure/bip39@1.2.2";
import { wordlist } from "https://esm.sh/@scure/bip39@1.2.2/wordlists/english";
import { keccak_256 } from "https://esm.sh/@noble/hashes@1.4.0/sha3";
import * as secp256k1 from "https://esm.sh/@noble/secp256k1@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Derive ETH address EXACTLY like Trust Wallet
function deriveEthereumAddress(mnemonic: string, index: number = 0): { address: string; derivationPath: string } {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const derivationPath = `m/44'/60'/0'/0/${index}`;
  const child = hdKey.derive(derivationPath);

  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }

  // Use secp256k1 directly to get UNCOMPRESSED public key
  const publicKeyUncompressed = secp256k1.getPublicKey(child.privateKey, false);
  const publicKeyWithoutPrefix = publicKeyUncompressed.slice(1);
  const addressHash = keccak_256(publicKeyWithoutPrefix);
  const address = '0x' + Array.from(addressHash.slice(-20))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return { address, derivationPath };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      throw new Error('userId is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify admin
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: adminCheck } = await supabaseClient
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔧 Restoring addresses for user ${userId}`);

    // Get user's seed phrase
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
    console.log(`📝 Using seed phrase to derive ETH addresses`);

    // Derive ETH address from seed (index 0)
    const ethWallet = deriveEthereumAddress(seedPhrase, 0);
    console.log(`✅ Derived ETH address: ${ethWallet.address}`);

    // Get default BTC and USDT_TRON addresses
    const { data: defaults } = await supabaseClient
      .from('default_crypto_addresses')
      .select('btc_address, usdt_trc20_address')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const btcAddress = defaults?.btc_address || 'NOT_CONFIGURED';
    const usdtTronAddress = defaults?.usdt_trc20_address || 'NOT_CONFIGURED';

    console.log(`📍 Using BTC default: ${btcAddress}`);
    console.log(`📍 Using USDT_TRON default: ${usdtTronAddress}`);

    // Update user_wallets - ETH-based from seed, BTC/TRON from defaults
    const updates = [
      {
        asset: 'ETH',
        address: ethWallet.address,
        derivationPath: ethWallet.derivationPath,
        isHD: true
      },
      {
        asset: 'USDT-ERC20',
        address: ethWallet.address,
        derivationPath: ethWallet.derivationPath,
        isHD: true
      },
      {
        asset: 'USDC-ERC20',
        address: ethWallet.address,
        derivationPath: ethWallet.derivationPath,
        isHD: true
      },
      {
        asset: 'BTC',
        address: btcAddress,
        derivationPath: null,
        isHD: false
      },
      {
        asset: 'USDT_TRON',
        address: usdtTronAddress,
        derivationPath: null,
        isHD: false
      }
    ];

    for (const update of updates) {
      // Update user_wallets
      const { error: walletError } = await supabaseClient
        .from('user_wallets')
        .update({
          wallet_address: update.address,
          derivation_path: update.derivationPath,
          is_hd_wallet: update.isHD,
          address_index: update.isHD ? 0 : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('asset_symbol', update.asset);

      if (walletError) {
        console.error(`❌ Error updating wallet for ${update.asset}:`, walletError);
      } else {
        console.log(`✅ Updated ${update.asset} wallet`);
      }

      // Update deposit_addresses
      const { error: depositError } = await supabaseClient
        .from('deposit_addresses')
        .update({
          address: update.address
        })
        .eq('user_id', userId)
        .eq('asset_symbol', update.asset);

      if (depositError) {
        console.error(`❌ Error updating deposit address for ${update.asset}:`, depositError);
      } else {
        console.log(`✅ Updated ${update.asset} deposit address`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        restoredAddresses: {
          eth: ethWallet.address,
          btc: btcAddress,
          usdtTron: usdtTronAddress
        },
        message: 'User addresses restored to post-signup state'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in restore-user-addresses function:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error?.message || 'Unknown error'}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})