
import React, { useState, useEffect } from 'react';
import { ArrowLeft, History, Download, Filter, ArrowUpRight, ArrowDownLeft, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { formatNumber } from '@/utils/currencyFormatter';
import { useLivePrices } from '@/hooks/useLivePrices';

interface Transaction {
  id: string;
  transaction_type: string;
  asset_symbol: string;
  amount: number;
  fee?: number;
  status: string;
  created_at: string;
  transaction_hash?: string;
  notes?: string;
}

const TransactionHistory = () => {
  const { user } = useAuth();
  const { prices } = useLivePrices();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to map asset symbols to crypto IDs for price lookup
  const getCryptoId = (symbol: string): string => {
    switch (symbol) {
      case 'BTC':
        return 'bitcoin';
      case 'ETH':
        return 'ethereum';
      case 'USDT':
      case 'USDT-ERC20':
      case 'USDT_TRON':
      case 'USDT-TRC20':
        return 'tether-erc20';
      case 'USDC':
      case 'USDC-ERC20':
        return 'usd-coin';
      case 'CAD/USD':
        return 'usd'; // Used for fiat conversions
      default:
        return symbol.toLowerCase();
    }
  };
  const [usdToCadRate, setUsdToCadRate] = useState(1.35);

  // Fetch live USD to CAD exchange rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        if (data.rates && data.rates.CAD) {
          setUsdToCadRate(data.rates.CAD);
        }
      } catch (error) {
        console.error('Error fetching USD-CAD exchange rate:', error);
      }
    };
    
    fetchExchangeRate();
    // Refresh every 5 minutes
    const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate fiat equivalent for a transaction
  const calculateFiatAmounts = (transaction: Transaction) => {
    if (!prices) return { usd: 0, cad: 0 };

    // Stablecoins: direct 1:1 USD
    if (
      transaction.asset_symbol === 'USDT' ||
      transaction.asset_symbol === 'USDT-ERC20' ||
      transaction.asset_symbol === 'USDT_TRON' ||
      transaction.asset_symbol === 'USDT-TRC20' ||
      transaction.asset_symbol === 'USDC' ||
      transaction.asset_symbol === 'USDC-ERC20'
    ) {
      const usdValue = transaction.amount * 1.0;
      return { usd: usdValue, cad: usdValue * usdToCadRate };
    }

    // Other assets: use live price
    const cryptoId = getCryptoId(transaction.asset_symbol);
    const currentPrice = prices[cryptoId] || 0;
    const usdValue = transaction.amount * currentPrice;
    const cadValue = usdValue * usdToCadRate;

    return { usd: usdValue, cad: cadValue };
  };
  useEffect(() => {
    if (user) {
      fetchTransactions();
      
      // Set up real-time subscription for transaction updates
      const channel = supabase
        .channel('transaction-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'user_transactions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Transaction change detected:', payload);
            
            if (payload.eventType === 'INSERT') {
              // Add new transaction to the beginning of the list
              setTransactions(prev => [payload.new as Transaction, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              // Update existing transaction
              setTransactions(prev => 
                prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t)
              );
            } else if (payload.eventType === 'DELETE') {
              // Remove deleted transaction
              setTransactions(prev => 
                prev.filter(t => t.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTransactions((data || []).map(t => ({ ...t, asset_symbol: t.currency })));
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'buy':
        return <ArrowDownLeft className="w-4 h-4 text-primary" />;
      case 'withdrawal':
      case 'sell':
        return <ArrowUpRight className="w-4 h-4 text-[hsl(var(--error-red))]" />;
      case 'bank_transfer':
        return <DollarSign className="w-4 h-4 text-accent-blue" />;
      default:
        return <History className="w-4 h-4 text-secondary" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-[hsl(var(--warning))]" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-[hsl(var(--error-red))]" />;
      default:
        return <Clock className="w-4 h-4 text-secondary" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-responsive-sm">Please log in to view your transaction history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[hsl(var(--accent-blue))]/5 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(var(--accent-purple))]/5 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container-responsive py-6 sm:py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 fade-in">
            <Link to="/dashboard" className="inline-flex items-center text-primary hover:text-primary/80 mb-4 text-sm sm:text-base transition-colors font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-responsive-2xl font-bold text-white mb-2">Transaction History</h1>
                <p className="text-responsive-sm text-white/90">View all your wallet transactions and transfers</p>
              </div>
              <div className="flex gap-3">
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold border-0 flex items-center gap-2" size="sm" onClick={fetchTransactions}>
                  <Filter className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="balance-card fade-in" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--accent-blue))]/20 to-[hsl(var(--accent-purple))]/20 rounded-2xl flex items-center justify-center border border-[hsl(var(--accent-blue))]/30">
                  <History className="w-6 h-6 text-accent-blue" />
                </div>
                <div>
                  <h2 className="text-responsive-lg font-bold text-white">Recent Transactions</h2>
                  <p className="text-white/80 text-sm">Your wallet activity</p>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-white font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">
                {loading ? 'Loading...' : `${transactions.length} Transaction${transactions.length !== 1 ? 's' : ''}`}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-[hsl(var(--accent-blue))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-responsive-sm">Loading your transactions...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-[hsl(var(--error-red))]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10 text-[hsl(var(--error-red))]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Error Loading Transactions</h3>
                <p className="text-white/90 mb-6 max-w-md mx-auto">{error}</p>
                <Button onClick={fetchTransactions} className="bg-primary hover:bg-primary/90 text-white font-bold border-0">
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && transactions.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-[hsl(var(--accent-blue))]/20 to-[hsl(var(--accent-purple))]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[hsl(var(--accent-blue))]/30">
                  <History className="w-10 h-10 text-accent-blue" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Transactions Yet</h3>
                <p className="text-white/90 mb-6 max-w-md mx-auto">
                  Your transaction history will appear here once you start making deposits, withdrawals, or transfers.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/dashboard/deposit">
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold border-0">
                      Make a Deposit
                    </Button>
                  </Link>
                  <Link to="/dashboard/withdraw">
                    <Button className="bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20">
                      Make a Withdrawal
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Transactions List */}
            {!loading && !error && transactions.length > 0 && (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="asset-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="icon-container">
                          {getTransactionIcon(transaction.transaction_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white text-responsive-sm">
                              {formatTransactionType(transaction.transaction_type)}
                            </p>
                            <Badge variant={getStatusVariant(transaction.status)} className="flex items-center gap-1">
                              {getStatusIcon(transaction.status)}
                              {transaction.status}
                            </Badge>
                          </div>
                          <p className="text-white/70 text-xs">
                            {format(new Date(transaction.created_at), 'MMM dd, yyyy • hh:mm a')}
                          </p>
                          {transaction.notes && (
                            <p className="text-white/70 text-xs truncate max-w-xs">
                              Notes: {transaction.notes}
                            </p>
                          )}
                          {transaction.transaction_hash && (
                            <p className="text-white/70 text-xs font-mono truncate max-w-xs">
                              Hash: {transaction.transaction_hash}
                            </p>
                          )}
                        </div>
                      </div>
                       <div className="text-right">
                         <p className="font-semibold text-white text-responsive-sm">
                           {transaction.amount.toFixed(2)} {transaction.asset_symbol || 'UNKNOWN'}
                         </p>
                         {transaction.transaction_type !== 'bank_transfer' && transaction.asset_symbol && (() => {
                           const fiatAmounts = calculateFiatAmounts(transaction);
                           return (
                             <div className="text-white/70 text-xs space-y-0">
                               <p>${formatNumber(fiatAmounts.usd)} USD</p>
                               <p>${formatNumber(fiatAmounts.cad)} CAD</p>
                             </div>
                           );
                         })()}
                          <p className="text-white/70 text-xs mt-1">
                            {format(new Date(transaction.created_at), 'MMM dd, yyyy • hh:mm a')}
                          </p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
