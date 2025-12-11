import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TransactionTable } from '@/components/admin/TransactionTable';
import { TransactionDetailsDialog } from '@/components/admin/TransactionDetailsDialog';
import { EditTransactionDialog } from '@/components/admin/EditTransactionDialog';
import { AddTransactionForm } from '@/components/admin/AddTransactionForm';
import { useLivePrices } from '@/hooks/useLivePrices';
import { Transaction, UserProfile, UserWallet } from '@/types/adminTransactions';
import { toast } from '@/hooks/use-toast';

const AdminTransactions = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [bankTransferDetails, setBankTransferDetails] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Note: This component uses table-responsive wrapper for mobile compatibility

  const { prices } = useLivePrices();
  const queryClient = useQueryClient();

  // Set up real-time subscription for transaction updates
  useEffect(() => {
    const transactionChannel = supabase
      .channel('admin-transaction-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_transactions'
        },
        (payload) => {
          console.log('Admin: Transaction change detected:', payload);

          // Invalidate and refetch transactions to get updated data with user profiles
          queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
          // Also invalidate wallet data immediately to update portfolio column
          queryClient.invalidateQueries({ queryKey: ['admin-user-wallets'] });

          // Show notification for new transactions
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Transaction",
              description: "A new transaction has been created",
            });
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for wallet balance updates
    const walletChannel = supabase
      .channel('admin-wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all wallet balance changes
          schema: 'public',
          table: 'user_wallets'
        },
        (payload) => {
          console.log('Admin: Wallet balance change detected:', payload);

          // Immediately invalidate wallet data to update portfolio column
          queryClient.invalidateQueries({ queryKey: ['admin-user-wallets'] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(transactionChannel);
      supabase.removeChannel(walletChannel);
    };
  }, [queryClient]);

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
        return 'usdc-erc20';
      case 'CAD/USD':
        return 'usd'; // For fiat currencies
      default:
        return symbol.toLowerCase();
    }
  };

  // Fetch all transactions with user profile data
  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions, isError: transactionsError } = useQuery({
    queryKey: ['admin-transactions'],
    staleTime: 0, // Always refetch to get latest data
    retry: false, // Don't retry on auth errors
    queryFn: async () => {
      console.log('Fetching admin transactions...');
      
      // First get all transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('user_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionError) {
        console.error('Error fetching transactions:', transactionError);
        throw transactionError;
      }

      console.log('Raw transaction data:', transactionData);

      if (!transactionData || transactionData.length === 0) {
        console.log('No transactions found');
        return [];
      }

      // Get unique user IDs from transactions
      const userIds = [...new Set(transactionData.map(t => t.user_id))];
      console.log('User IDs from transactions:', userIds);

      // Fetch user profiles for these user IDs, including emails
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, first_name, last_name, email')
        .in('user_id', userIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        // Don't throw error, just continue without profiles
      }

      console.log('Profile data:', profileData);

      // Get user emails from auth to filter out orphaned data
      const { data: sessionResult } = await supabase.auth.getSession();
      const token = sessionResult?.session?.access_token;
      
      let emailResponse: { users?: any[] } | null = null;
      
      // Only fetch emails if we have a valid token
      if (token) {
        const { data, error: emailError } = await supabase.functions.invoke('get-user-emails', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (emailError) {
          console.error('Error fetching user emails:', emailError);
        } else {
          emailResponse = data;
        }
      } else {
        console.warn('No active session for fetching user emails');
      }

      // Filter transactions - if no email data, show all transactions
      const validTransactions = emailResponse?.users 
        ? transactionData.filter(transaction => 
            emailResponse?.users?.some((u: any) => u.id === transaction.user_id)
          )
        : transactionData;

      console.log('Filtered valid transactions:', validTransactions.length, 'out of', transactionData.length);

      // Transform the data to match our Transaction interface
      const transformedData = validTransactions.map(transaction => {
        const userProfile = profileData?.find(profile => profile.user_id === transaction.user_id);
        
        console.log(`Transaction ${transaction.id} - User ID: ${transaction.user_id}, Found profile:`, userProfile);
        
        // Calculate USD value based on crypto amount and current price
        let usdValue = 0;
        
        // For stablecoins and CAD/USD, use direct value
        if (transaction.currency === 'USDT' || transaction.currency === 'USDT-ERC20' || 
            transaction.currency === 'USDT_TRON' || transaction.currency === 'USDT-TRC20' ||
            transaction.currency === 'USDC' || transaction.currency === 'USDC-ERC20') {
          usdValue = transaction.amount * 1.0; // Stablecoins are $1
        } else if (transaction.currency === 'CAD/USD') {
          usdValue = transaction.amount / 1.35; // Convert CAD to USD
        } else if (prices) {
          const cryptoId = getCryptoId(transaction.currency);
          const currentPrice = prices[cryptoId] || 0;
          usdValue = transaction.amount * currentPrice;
        }
        
        // Calculate CAD value (1 USD = 1.35 CAD approximately)
        const cadValue = usdValue * 1.35;
        
        return {
          ...transaction,
          asset_symbol: transaction.currency, // Map currency to asset_symbol
          crypto_amount: transaction.amount,
          usd_amount: usdValue,
          usd_amount_display: usdValue,
          cad_amount_display: cadValue,
          amount_fiat: transaction.amount_fiat,
          transaction_date: transaction.created_at || new Date().toISOString(),
          user_profile: {
            full_name: userProfile?.full_name || null,
            email: userProfile?.email || null
          }
        };
      });

      console.log('Transformed transactions:', transformedData);
      return transformedData as Transaction[];
    },
  });

  // Fetch all users for the add transaction form
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, first_name, last_name, email')
        .order('full_name');

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      // Get user emails from auth to filter out orphaned profiles
      const { data: sessionResult2 } = await supabase.auth.getSession();
      const token2 = sessionResult2?.session?.access_token;
      
      let emailResponse: { users?: any[] } | null = null;
      
      // Only fetch emails if we have a valid token
      if (token2) {
        const { data, error: emailError } = await supabase.functions.invoke('get-user-emails', {
          headers: { Authorization: `Bearer ${token2}` },
        });
        
        if (emailError) {
          console.error('Error fetching user emails:', emailError);
        } else {
          emailResponse = data;
        }
      }

      // Filter out orphaned profiles - if no email data, return all users
      const validUsers = emailResponse?.users 
        ? data?.filter(profile => 
            emailResponse?.users?.some((u: any) => u.id === profile.user_id)
          )
        : data;

      return validUsers as UserProfile[];
    },
  });

  // Fetch user wallets for portfolio calculations
  const { data: userWallets, error: walletsError, refetch: refetchWallets } = useQuery({
    queryKey: ['admin-user-wallets'],
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*');

      if (error) {
        console.error('❌ Error fetching user wallets:', error);
        throw error;
      }

      console.log('✅ Fetched', data?.length || 0, 'user wallets');
      return data as UserWallet[];
    },
  });

  // Log wallet fetch errors and refetch on mount
  useEffect(() => {
    if (walletsError) {
      console.error('Wallets query error:', walletsError);
    }
    // Invalidate wallets query when component mounts to force fresh fetch
    queryClient.invalidateQueries({ queryKey: ['admin-user-wallets'] });
  }, []);

  const handleViewDetails = useCallback(async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    
    // Fetch bank transfer details if this is a bank transfer transaction
    if (transaction.transaction_type === 'bank_transfer') {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('transaction_id', transaction.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching bank transfer details:', error);
        setBankTransferDetails(null);
      } else {
        setBankTransferDetails(data);
      }
    } else {
      setBankTransferDetails(null);
    }
    
    setIsDetailsDialogOpen(true);
  }, []);

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteTransaction = useCallback(async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('user_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });

      refetchTransactions();
      queryClient.invalidateQueries({ queryKey: ['admin-user-wallets'] });
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: `Failed to delete transaction: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [queryClient, refetchTransactions]);

  const handleUpdateTransaction = useCallback(async (updatedTransaction: any) => {
    try {
      // Optimistic update - update UI immediately
      queryClient.setQueryData(['admin-transactions'], (old: Transaction[] | undefined) => {
        if (!old) return old;
        return old.map(t =>
          t.id === updatedTransaction.id
            ? { ...t, ...updatedTransaction, asset_symbol: updatedTransaction.asset_symbol }
            : t
        );
      });

      const { error } = await supabase
        .from('user_transactions')
        .update({
          currency: updatedTransaction.asset_symbol,
          transaction_type: updatedTransaction.transaction_type,
          amount: updatedTransaction.crypto_amount,
          status: updatedTransaction.status,
          created_at: updatedTransaction.transaction_date,
          transaction_hash: updatedTransaction.transaction_hash,
          to_address: updatedTransaction.to_address
        })
        .eq('id', updatedTransaction.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });

      setIsEditDialogOpen(false);

      // Refetch to ensure data consistency and update portfolio column
      refetchTransactions();
      queryClient.invalidateQueries({ queryKey: ['admin-user-wallets'] });
    } catch (error: any) {
      console.error('Error updating transaction:', error);

      // Revert optimistic update on error
      refetchTransactions();
      queryClient.invalidateQueries({ queryKey: ['admin-user-wallets'] });

      toast({
        title: "Error",
        description: `Failed to update transaction: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [queryClient, refetchTransactions]);

  const handleDeleteAllTransactions = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('user_transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) throw error;

      toast({
        title: "Success",
        description: "All transactions deleted successfully",
      });

      refetchTransactions();
    } catch (error: any) {
      console.error('Error deleting all transactions:', error);
      toast({
        title: "Error",
        description: `Failed to delete transactions: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [refetchTransactions]);

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!searchQuery.trim()) return transactions;

    const query = searchQuery.toLowerCase().trim();
    return transactions.filter(transaction => {
      const userName = transaction.user_profile?.full_name?.toLowerCase() || '';
      const userEmail = transaction.user_profile?.email?.toLowerCase() || '';
      const userId = transaction.user_id?.toLowerCase() || '';
      return userName.includes(query) || userEmail.includes(query) || userId.includes(query);
    });
  }, [transactions, searchQuery]);

  return (
    <div className="container-responsive py-4 sm:py-6 px-3 sm:px-4">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-2xl">Transaction Management</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Monitor and manage all user transactions across the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          <div className="flex flex-col gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-xs sm:text-sm text-[hsl(var(--accent-charcoal))] placeholder:text-[hsl(var(--muted-foreground))]"
              />
            </div>

            {/* Transaction Count and Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-xs sm:text-sm text-muted-foreground">
                {filteredTransactions?.length || 0} of {transactions?.length || 0} transactions
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchTransactions()}
                  className="text-xs sm:text-sm w-full sm:w-auto bg-gray-600 text-white hover:bg-gray-700 border-gray-600"
                >
                  <RefreshCw className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                  Refresh
                </Button>
                <AddTransactionForm users={users} />
              </div>
            </div>
          </div>

          {transactionsLoading ? (
            <div className="text-center py-6 sm:py-8">
              <div className="text-muted-foreground text-xs sm:text-sm">Loading transactions...</div>
            </div>
          ) : transactionsError ? (
            <div className="text-center py-6 sm:py-8">
              <div className="text-red-500 text-xs sm:text-sm mb-2">Failed to load transactions</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchTransactions()}
                className="text-xs sm:text-sm"
              >
                <RefreshCw className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <TransactionTable
              transactions={filteredTransactions}
              userWallets={userWallets}
              prices={prices}
              onViewDetails={handleViewDetails}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        transaction={selectedTransaction}
        bankTransferDetails={bankTransferDetails}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
      />

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        transaction={selectedTransaction}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleUpdateTransaction}
      />
    </div>
  );
};

export default AdminTransactions;