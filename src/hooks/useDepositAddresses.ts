import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { DepositAddress } from '@/types/depositAddress';

export const useDepositAddresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<DepositAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptedAutoInit, setAttemptedAutoInit] = useState(false);

  const fetchAddresses = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('📍 Fetching deposit addresses for user:', user.id);

    try {
      // First, fetch default addresses for BTC and USDT-TRC20
      const { data: defaults } = await supabase
        .from('default_crypto_addresses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const defaultBtc = defaults?.btc_address || '';
      const defaultUsdtTrc20 = defaults?.usdt_trc20_address || '';

      console.log('📍 Default addresses:', { defaultBtc, defaultUsdtTrc20 });

      // Fetch wallet addresses directly from user_wallets table
      const { data, error: supabaseError } = await supabase
        .from('user_wallets')
        .select('id, asset_symbol, wallet_address, is_active, created_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true});

      console.log('📍 Fetched user wallets:', data);

      if (supabaseError) {
        throw supabaseError;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No wallets found for user');
        // Attempt automatic initialization exactly once if seed already exists
        if (!attemptedAutoInit) {
          setAttemptedAutoInit(true);
          try {
            const { data: seedRow } = await supabase
              .from('user_seed_phrases')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (seedRow) {
              console.log('🛠️ Auto-initializing wallets from existing seed');
              await supabase.functions.invoke('initialize-user-wallets', {
                body: {
                  userId: user.id,
                  userEmail: user.email ?? 'auto@local',
                  userPassword: 'AUTO_INIT'
                }
              });
              // After init, refetch addresses
              return await fetchAddresses();
            }
          } catch (autoErr) {
            console.error('Auto-initialization failed:', autoErr);
          }
        }
        setAddresses([]);
        setError('No wallets found. Please initialize your wallets.');
        setLoading(false);
        return;
      }

      // Transform user_wallets data to deposit addresses
      // Use wallet address if it's been customized by admin, otherwise use defaults for BTC and USDT-TRC20
      const transformedAddresses: DepositAddress[] = (data || []).map(wallet => {
        let address = wallet.wallet_address;
        
        // Only use default addresses if the wallet address is EXACTLY the generic placeholder (not customized by admin)
        if (wallet.asset_symbol === 'BTC' && (wallet.wallet_address === 'BitcoinWallet' || !wallet.wallet_address)) {
          address = defaultBtc;
        }
        
        if ((wallet.asset_symbol === 'USDT_TRON' || wallet.asset_symbol === 'USDT-TRC20') && 
            (wallet.wallet_address === 'USDTtrc20Wallet' || !wallet.wallet_address)) {
          address = defaultUsdtTrc20;
        }

        return {
          id: wallet.id,
          user_id: user.id,
          asset_symbol: wallet.asset_symbol,
          address,
          network: getNetworkFromAsset(wallet.asset_symbol),
          is_active: wallet.is_active,
          created_at: wallet.created_at,
          updated_at: wallet.created_at
        };
      });

      setAddresses(transformedAddresses);
      setError(null);
      console.log('✅ Deposit addresses set:', transformedAddresses.length, 'addresses');
    } catch (err: any) {
      console.error('❌ Error fetching deposit addresses:', err);
      setError(err.message);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine network from asset symbol
  const getNetworkFromAsset = (assetSymbol: string): string => {
    switch (assetSymbol) {
      case 'BTC':
        return 'bitcoin';
      case 'ETH':
        return 'ethereum';
      case 'USDT-ERC20':
      case 'USDT':
      case 'USDC-ERC20':
        return 'erc20'; // Default ERC20 tokens
      case 'USDT-TRC20':
      case 'USDT_TRON':
        return 'trc20';
      default:
        return 'mainnet';
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  return {
    addresses,
    loading,
    error,
    refetch: fetchAddresses
  };
};