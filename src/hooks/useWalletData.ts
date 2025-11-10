import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface WalletData {
  id: string;
  symbol: string;
  balance: {
    crypto: number;
  };
  walletAddress?: string;
  network?: string;
  updatedAt: Date;
}

export const useWalletData = (prices?: { [key: string]: number }) => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async (isInitialLoad = false) => {
    // Removed verbose logging for performance
    if (!user) {
      setLoading(false);
      setError('You must be logged in to view wallet data');
      return;
    }

    // Only set loading state on initial load to prevent flashing
    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Removed verbose logging for performance

      if (error) {
        throw error;
      }

      const formattedData: WalletData[] = data.map(wallet => ({
        id: wallet.id,
        symbol: wallet.asset_symbol,
        balance: {
          crypto: Number(wallet.balance_crypto)
        },
        walletAddress: wallet.wallet_address,
        updatedAt: new Date(wallet.updated_at)
      }));

      // Removed verbose logging for performance
      setWalletData(formattedData);
    } catch (err: any) {
      console.error('❌ Error fetching wallet data:', err);
      setError(err.message || 'Failed to load wallet data');
      if (isInitialLoad) {
        toast({
          title: 'Error',
          description: 'Failed to fetch wallet data. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWalletData(true); // Initial load
    
    // Set up real-time subscription for wallet updates (no polling needed!)
    const channel = supabase
      .channel('user-wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          fetchWalletData(false); // Background refresh
        }
      )
      .subscribe();

    // Listen for transaction changes that might affect wallet balances
    const transactionChannel = supabase
      .channel('user-transaction-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_transactions',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          fetchWalletData(false); // Background refresh
        }
      )
      .subscribe();
    
    // Listen for wallet data updates from admin panel
    const handleWalletDataUpdate = () => {
      fetchWalletData(false); // Background refresh
    };
    
    window.addEventListener('wallet-data-updated', handleWalletDataUpdate);
    
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(transactionChannel);
      window.removeEventListener('wallet-data-updated', handleWalletDataUpdate);
    };
  }, [fetchWalletData, user?.id]);

  const refreshData = async () => {
    await fetchWalletData();
  };

  // Helper function to get the correct crypto ID for price lookup
  const getCryptoId = (symbol: string, network?: string): string => {
    switch (symbol) {
      case 'BTC':
        return 'bitcoin';
      case 'ETH':
        return 'ethereum';
      case 'USDT':
      case 'USDT-ERC20':
        return 'usdt-erc20';
      case 'USDT_TRON':
      case 'USDT-TRC20':
        return 'usdt_tron';
      case 'USDC':
      case 'USDC-ERC20':
        return 'usdc-erc20';
      default:
        return symbol.toLowerCase();
    }
  };

  // Calculate total balance using live prices
  const totalBalanceUSD = walletData.reduce((total, wallet) => {
    // Removed verbose logging for performance
    
    if (prices) {
      const cryptoId = getCryptoId(wallet.symbol, wallet.network);
      const currentPrice = prices[cryptoId] || 0;
      const currentValue = wallet.balance.crypto * currentPrice;
      // Removed verbose logging for performance
      return total + currentValue;
    }
    // If no prices available yet, return 0 to avoid showing stale data
    return total;
  }, 0);

  // Removed verbose logging for performance

  return {
    walletData,
    loading,
    error,
    refreshData,
    totalBalanceUSD
  };
};
