import { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_EUR_USD_RATE,
  EXCHANGE_RATE_API_URL,
  EXCHANGE_RATE_REFRESH_INTERVAL
} from '@/types/bankDeposit';

interface UseExchangeRateOptions {
  /** Base currency (default: 'USD') */
  baseCurrency?: string;
  /** Target currency (default: 'EUR') */
  targetCurrency?: string;
  /** Whether to auto-refresh the rate */
  autoRefresh?: boolean;
  /** Refresh interval in milliseconds (default: 5 minutes) */
  refreshInterval?: number;
}

interface UseExchangeRateReturn {
  /** The exchange rate (target per base) */
  exchangeRate: number;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refetch the exchange rate */
  refetch: () => Promise<void>;
  /** Convert from base to target currency */
  convertToTarget: (amount: number) => number;
  /** Convert from target to base currency */
  convertToBase: (amount: number) => number;
}

/**
 * Custom hook for fetching and managing exchange rates
 * Includes auto-refresh and conversion utilities
 *
 * @param options - Configuration options
 * @returns Exchange rate state and utilities
 *
 * @example
 * ```tsx
 * const { exchangeRate, convertToTarget, convertToBase } = useExchangeRate();
 * const eurAmount = convertToTarget(100); // Convert $100 to EUR
 * const usdAmount = convertToBase(93); // Convert €93 to USD
 * ```
 */
export const useExchangeRate = (
  options: UseExchangeRateOptions = {}
): UseExchangeRateReturn => {
  const {
    baseCurrency = 'USD',
    targetCurrency = 'EUR',
    autoRefresh = true,
    refreshInterval = EXCHANGE_RATE_REFRESH_INTERVAL
  } = options;

  const [exchangeRate, setExchangeRate] = useState<number>(DEFAULT_EUR_USD_RATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchExchangeRate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(EXCHANGE_RATE_API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.rates && data.rates[targetCurrency]) {
        const rate = data.rates[targetCurrency];
        setExchangeRate(rate);
        console.log(`${baseCurrency}/${targetCurrency} Exchange Rate Updated:`, rate);
      } else {
        throw new Error(`Rate for ${targetCurrency} not found in response`);
      }
    } catch (err) {
      console.error('Failed to fetch exchange rate:', err);
      setError(err as Error);
      // Keep the default/previous rate on error
    } finally {
      setLoading(false);
    }
  }, [baseCurrency, targetCurrency]);

  // Convert from base currency to target currency
  const convertToTarget = useCallback((amount: number): number => {
    return amount * exchangeRate;
  }, [exchangeRate]);

  // Convert from target currency to base currency
  const convertToBase = useCallback((amount: number): number => {
    if (exchangeRate === 0) return 0;
    return amount / exchangeRate;
  }, [exchangeRate]);

  // Initial fetch
  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchExchangeRate, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchExchangeRate]);

  return {
    exchangeRate,
    loading,
    error,
    refetch: fetchExchangeRate,
    convertToTarget,
    convertToBase
  };
};

export default useExchangeRate;
