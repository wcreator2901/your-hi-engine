import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WalletData {
  id: string;
  user_id: string;
  asset_symbol: string;
  wallet_address: string;
  wallet_name: string;
  balance: number | null;
  balance_crypto: number | null;
  balance_fiat: number | null;
  is_active: boolean | null;
  nickname: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Map URL symbols to database symbols
const mapSymbolToDatabase = (symbol: string): string => {
  const upperSymbol = symbol.toUpperCase();
  const symbolMap: Record<string, string> = {
    'USDT-TRC20': 'USDT_TRON',
    'USDT-ERC20': 'USDT-ERC20',
    'USDC-ERC20': 'USDC-ERC20',
  };
  return symbolMap[upperSymbol] || upperSymbol;
};

export const useSingleWalletData = (assetSymbol: string) => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = async () => {
    if (!user || !assetSymbol) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const dbSymbol = mapSymbolToDatabase(assetSymbol);
      
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset_symbol', dbSymbol)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setWalletData(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      setError(err.message);
      setWalletData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user, assetSymbol]);

  return {
    walletData,
    loading,
    error,
    refetch: fetchWalletData
  };
};