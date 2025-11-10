import { supabase } from '@/integrations/supabase/client';
import { deriveEthereumAddress, deriveUSDTERC20Address, deriveBitcoinAddress, deriveUSDTTRC20Address } from './hdWallet';

/**
 * Generate wallet addresses for a user from their existing seed phrase
 */
export async function generateWalletsFromSeed(userId: string, seedPhrase: string) {
  try {
    // Derive addresses from the seed phrase
    const ethAddress = deriveEthereumAddress(seedPhrase, 0);
    const usdtAddress = deriveUSDTERC20Address(seedPhrase, 0);
    const btcAddress = deriveBitcoinAddress(seedPhrase, 0);
    const usdtTrc20Address = deriveUSDTTRC20Address(seedPhrase, 0);
    
    // Prepare wallet data
    const walletsToInsert = [
      {
        user_id: userId,
        asset_symbol: 'ETH',
        wallet_address: ethAddress.address,
        wallet_type: 'ethereum',
        wallet_name: 'Ethereum Wallet',
        derivation_path: ethAddress.derivationPath,
        address_index: 0,
        is_hd_wallet: true,
        is_active: true,
        balance: 0,
        balance_crypto: 0,
        balance_fiat: 0
      },
      {
        user_id: userId,
        asset_symbol: 'USDT',
        wallet_address: usdtAddress.address,
        wallet_type: 'erc20',
        wallet_name: 'USDT Wallet',
        derivation_path: usdtAddress.derivationPath,
        address_index: 0,
        is_hd_wallet: true,
        is_active: true,
        balance: 0,
        balance_crypto: 0,
        balance_fiat: 0
      },
      {
        user_id: userId,
        asset_symbol: 'BTC',
        wallet_address: btcAddress.address,
        wallet_type: 'bitcoin',
        wallet_name: 'Bitcoin Wallet',
        derivation_path: btcAddress.derivationPath,
        address_index: 0,
        is_hd_wallet: true,
        is_active: true,
        balance: 0,
        balance_crypto: 0,
        balance_fiat: 0
      },
      {
        user_id: userId,
        asset_symbol: 'USDT-TRC20',
        wallet_address: usdtTrc20Address.address,
        wallet_type: 'trc20',
        wallet_name: 'USDT TRC20 Wallet',
        derivation_path: usdtTrc20Address.derivationPath,
        address_index: 0,
        is_hd_wallet: true,
        is_active: true,
        balance: 0,
        balance_crypto: 0,
        balance_fiat: 0
      }
    ];

    // Insert wallets into database
    const { data, error } = await supabase
      .from('user_wallets')
      .insert(walletsToInsert)
      .select();

    if (error) {
      console.error('Error creating wallets:', error);
      throw error;
    }

    console.log('✅ Successfully generated wallets:', data);
    return { success: true, wallets: data };
  } catch (error) {
    console.error('Error in generateWalletsFromSeed:', error);
    return { success: false, error };
  }
}
