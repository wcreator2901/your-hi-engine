import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CryptoPrices {
  [key: string]: number;
}

export const useLivePrices = (updateInterval: number = 0) => { // Default no polling
  const [prices, setPrices] = useState<CryptoPrices>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFromTable = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_prices')
        .select('*');
      if (error) throw error;
      const map: CryptoPrices = {};
      data?.forEach((row: any) => {
        map[row.id] = Number(row.price) || 0;
      });
      if (Object.keys(map).length > 0) {
        setPrices(map);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error loading prices from table:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshViaEdge = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await supabase.functions.invoke('update-crypto-prices');
      if (error) throw error;
      // Edge function already upserts; we just set local state for snappy UI
      if (data?.prices) {
        setPrices(data.prices);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error refreshing prices via edge function:', err);
      setError('Failed to refresh live prices');
    }
  }, []);

  // Initial load and subscription
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      await fetchFromTable();

      channel = supabase
        .channel('crypto-price-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'crypto_prices' },
          (payload) => {
            console.log('📈 Price update received:', payload);
            const row: any = (payload as any).new || (payload as any).old;
            if (row?.id) {
              setPrices((prev) => ({ ...prev, [row.id]: Number(row.price) || 0 }));
              setLastUpdated(new Date());
            } else {
              fetchFromTable();
            }
          }
        )
        .subscribe((status) => {
          console.log('🔌 Price channel status:', status);
        });

      // Proactively refresh once on mount to populate if table is empty/stale
      refreshViaEdge();
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchFromTable, refreshViaEdge]);

  // Optional background refresh using edge function
  useEffect(() => {
    if (!updateInterval || updateInterval <= 0) return;
    const id = setInterval(() => {
      refreshViaEdge();
    }, updateInterval);
    return () => clearInterval(id);
  }, [updateInterval, refreshViaEdge]);

  const getPriceForCrypto = useCallback((cryptoId: string): number => {
    return prices[cryptoId] ?? 0;
  }, [prices]);

  return {
    prices,
    isLoading,
    lastUpdated,
    error,
    getPriceForCrypto,
    refreshPrices: refreshViaEdge,
  };
};
