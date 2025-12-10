import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BankDepositDetails } from '@/types/bankDeposit';

interface UseEurBalanceOptions {
  /** Whether to set up real-time subscription */
  realtime?: boolean;
}

interface UseEurBalanceReturn {
  /** The deposit details including EUR balance */
  depositDetails: BankDepositDetails | null;
  /** The EUR balance (shorthand) */
  eurBalance: number;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refetch the balance */
  refetch: () => Promise<void>;
  /** Update EUR balance directly (for optimistic updates) */
  setEurBalance: (balance: number) => void;
}

/**
 * Custom hook for fetching and managing EUR balance from user_bank_deposit_details
 * Includes real-time subscription support for automatic updates
 *
 * @param userId - The user ID to fetch balance for
 * @param options - Configuration options
 * @returns EUR balance state and utilities
 *
 * @example
 * ```tsx
 * const { eurBalance, depositDetails, loading, refetch } = useEurBalance(user?.id);
 * ```
 */
export const useEurBalance = (
  userId: string | null | undefined,
  options: UseEurBalanceOptions = { realtime: true }
): UseEurBalanceReturn => {
  const [depositDetails, setDepositDetails] = useState<BankDepositDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!userId) {
      setDepositDetails(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Using type assertion as table may not be in generated types yet
      const { data, error: fetchError } = await (supabase as any)
        .from('user_bank_deposit_details')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setDepositDetails(data as BankDepositDetails || null);
    } catch (err) {
      console.error('Error fetching EUR balance:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const setEurBalance = useCallback((balance: number) => {
    setDepositDetails(prev => prev ? { ...prev, amount_eur: balance } : null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Real-time subscription
  useEffect(() => {
    if (!userId || !options.realtime) return;

    const channel = supabase
      .channel(`eur-balance-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_bank_deposit_details',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('EUR balance update received:', payload);
          // Update from payload for immediate response, or refetch for complete data
          if (payload.new && typeof payload.new === 'object' && 'amount_eur' in payload.new) {
            setDepositDetails(payload.new as BankDepositDetails);
          } else {
            fetchBalance();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up EUR balance subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, options.realtime, fetchBalance]);

  return {
    depositDetails,
    eurBalance: depositDetails?.amount_eur || 0,
    loading,
    error,
    refetch: fetchBalance,
    setEurBalance
  };
};

export default useEurBalance;
