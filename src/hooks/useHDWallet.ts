import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { generateHDWallet, generateAddressesFromMnemonic, validateMnemonic, type HDWalletAddress } from '@/utils/hdWallet';
import { encryptSeedPhrase } from '@/utils/encryption';
import { useToast } from '@/hooks/use-toast';
import { SecurityLogger } from '@/utils/securityLogger';

export const useHDWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Generate a new HD wallet for the user
   */
  const generateNewHDWallet = useCallback(async (password: string): Promise<string | null> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      console.log('🧪 Generating NEW HD wallet with Trust Wallet compatibility...');
      
      // Generate new HD wallet using EXACT Trust Wallet algorithms
      const walletData = generateHDWallet();
      
      console.log('✅ Trust Wallet compatible addresses generated:');
      walletData.addresses.forEach(addr => {
        console.log(`  ${addr.asset}: ${addr.address}`);
      });
      
      // Generate addresses from the actual mnemonic for all supported assets
      const mnemonic = walletData.mnemonic;
      const updatedAddresses = generateAddressesFromMnemonic(mnemonic, 0);
      
      // Log the wallet generation (without sensitive data)
      SecurityLogger.logSeedPhraseAccess(user.id, 'generate');
      
      // Encrypt the mnemonic for user access
      const encryptedMnemonic = encryptSeedPhrase(walletData.mnemonic, user.email || '', password);

      // Create admin-encrypted copy on the server (AES-GCM with server key) - MANDATORY
      console.log('🔐 Creating admin-encrypted copy for recovery...');
      const { data: adminEncRes, error: adminEncError } = await supabase.functions.invoke('secure-encryption', {
        body: { action: 'encrypt', data: walletData.mnemonic }
      });
      
      if (adminEncError || !adminEncRes?.encrypted) {
        console.error('❌ CRITICAL: Admin encryption failed:', adminEncError);
        throw new Error('Failed to create admin recovery backup. This is required for account security.');
      }
      
      console.log('✅ Admin-encrypted copy created successfully');
      
      // Store seed phrase (plain text)
      const { error: seedError } = await supabase
        .from('user_seed_phrases')
        .insert({
          user_id: user.id,
          encrypted_seed_phrase: encryptedMnemonic,
          seed_phrase: mnemonic
        });

      if (seedError) {
        throw seedError;
      }

      // Store HD wallet addresses using the properly derived addresses
      const walletInserts = updatedAddresses.map(addr => ({
        user_id: user.id,
        asset_symbol: addr.asset,
        wallet_name: `${addr.asset} HD Wallet`,
        wallet_address: addr.address,
        wallet_type: 'hd_wallet',
        derivation_path: addr.derivationPath,
        address_index: addr.addressIndex,
        is_hd_wallet: true,
        balance_crypto: 0,
        balance_fiat: 0,
        is_active: true
      }));

      const { error: walletError } = await supabase
        .from('user_wallets')
        .insert(walletInserts);

      if (walletError) {
        throw walletError;
      }

      toast({
        title: "HD Wallet Generated",
        description: "Your new HD wallet has been created successfully with unique addresses for all supported cryptocurrencies.",
      });

      return walletData.mnemonic;
    } catch (error: any) {
      console.error('Error generating HD wallet:', error);
      SecurityLogger.logSuspiciousActivity(user.id, 'hd_wallet_generation_failed', { error: error.message });
      
      toast({
        title: "Error",
        description: "Failed to generate HD wallet. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  /**
   * Generate next addresses for existing HD wallet
   */
  const generateNextAddresses = useCallback(async (mnemonic: string): Promise<HDWalletAddress[]> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    setLoading(true);
    try {
      // Get current highest address index for this user
      const queryResult: any = (supabase as any)
        .from('user_wallets')
        .select('address_index, asset_symbol')
        .eq('user_id', user.id)
        .eq('is_hd_wallet', true)
        .order('address_index', { ascending: false })
        .limit(1);

      const { data: currentWallets, error: fetchError } = await queryResult;

      if (fetchError) {
        throw fetchError;
      }

      const nextIndex = currentWallets && currentWallets.length > 0 
        ? (currentWallets[0].address_index || 0) + 1 
        : 1;

      console.log('🧪 Generating NEXT addresses with Trust Wallet compatibility...');
      
      // Generate new addresses using EXACT Trust Wallet algorithms
      const newAddresses = generateAddressesFromMnemonic(mnemonic, nextIndex);
      
      console.log('✅ Trust Wallet compatible next addresses generated:');
      newAddresses.forEach(addr => {
        console.log(`  ${addr.asset}[${nextIndex}]: ${addr.address}`);
      });
      
      // Store new addresses
      const walletInserts = newAddresses.map(addr => ({
        user_id: user.id,
        asset_symbol: addr.asset,
        wallet_name: `${addr.asset} HD Wallet #${nextIndex + 1}`,
        wallet_address: addr.address,
        wallet_type: 'hd_wallet',
        derivation_path: addr.derivationPath,
        address_index: addr.addressIndex,
        is_hd_wallet: true,
        balance_crypto: 0,
        balance_fiat: 0,
        is_active: true
      }));

      const { error: insertError } = await supabase
        .from('user_wallets')
        .insert(walletInserts);

      if (insertError) {
        throw insertError;
      }

      SecurityLogger.logSeedPhraseAccess(user.id, 'view'); // Log address generation
      
      toast({
        title: "New Addresses Generated",
        description: `Generated new receive addresses (#${nextIndex + 1}) for all cryptocurrencies.`,
      });

      return newAddresses;
    } catch (error: any) {
      console.error('Error generating next addresses:', error);
      
      toast({
        title: "Error",
        description: "Failed to generate new addresses. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  /**
   * Migrate existing non-HD wallets to HD wallets
   */
  const migrateToHDWallet = useCallback(async (password: string): Promise<string | null> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      // Check if user already has HD wallets
      const checkQuery: any = (supabase as any)
        .from('user_wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_hd_wallet', true)
        .limit(1);
      
      const { data: existingHD, error: checkError } = await checkQuery;

      if (checkError) {
        throw checkError;
      }

      if (existingHD && existingHD.length > 0) {
        throw new Error('User already has HD wallet addresses');
      }

      // Mark existing wallets as legacy (non-HD)
      const updateQuery: any = (supabase as any)
        .from('user_wallets')
        .update({ 
          is_active: false, 
          wallet_name: 'Legacy Wallet (Inactive)',
          nickname: 'Migrated to HD Wallet'
        })
        .eq('user_id', user.id)
        .eq('is_hd_wallet', false);

      const { error: updateError } = await updateQuery;

      if (updateError) {
        throw updateError;
      }

      // Generate new HD wallet
      return await generateNewHDWallet(password);
    } catch (error: any) {
      console.error('Error migrating to HD wallet:', error);
      
      toast({
        title: "Migration Error",
        description: "Failed to migrate to HD wallet. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, toast, generateNewHDWallet]);

  return {
    generateNewHDWallet,
    generateNextAddresses,
    migrateToHDWallet,
    loading
  };
};