
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Eye, Edit, Trash2, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatNumber } from '@/utils/currencyFormatter';
import { Transaction, UserWallet } from '@/types/adminTransactions';

interface TransactionTableProps {
  transactions: Transaction[] | undefined;
  userWallets: UserWallet[] | undefined;
  prices: any;
  onViewDetails: (transaction: Transaction) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  userWallets,
  prices,
  onViewDetails,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const getCryptoId = (symbol: string): string => {
    switch (symbol) {
      case 'BTC':
        return 'bitcoin';
      case 'ETH':
        return 'ethereum';
      case 'USDT':
        return 'tether';
      case 'USDC':
        return 'usdc';
      default:
        return symbol.toLowerCase();
    }
  };

  // Memoize portfolio balances to prevent recalculation on every render
  const portfolioBalances = useMemo(() => {
    if (!userWallets || !prices) return new Map<string, number>();

    const balanceMap = new Map<string, number>();
    
    // Group wallets by user
    const userWalletsMap = new Map<string, typeof userWallets>();
    userWallets.forEach(wallet => {
      if (!userWalletsMap.has(wallet.user_id)) {
        userWalletsMap.set(wallet.user_id, []);
      }
      userWalletsMap.get(wallet.user_id)!.push(wallet);
    });

    // Calculate balance for each user
    userWalletsMap.forEach((wallets, userId) => {
      const total = wallets.reduce((sum, wallet) => {
        const cryptoId = getCryptoId(wallet.asset_symbol);
        const currentPrice = prices[cryptoId] || 0;
        const walletValue = wallet.balance_crypto * currentPrice;
        return sum + walletValue;
      }, 0);
      balanceMap.set(userId, total);
    });

    return balanceMap;
  }, [userWallets, prices]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'withdrawal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'buy':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'sell':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'bank_transfer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const copyUserUID = async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      toast({
        title: "Copied!",
        description: "User UID copied to clipboard",
        duration: 1000,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy UID",
        variant: "destructive",
      });
    }
  };

  const extractUsername = (email: string): string => {
    if (!email) return 'no-username';
    return email.split('@')[0];
  };

  return (
    <div className="table-responsive overflow-x-auto -mx-3 sm:mx-0">
      <Table>
        <TableHeader>
          <TableRow className="text-[10px] sm:text-xs">
            <TableHead className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">Actions</TableHead>
            <TableHead className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">Portfolio</TableHead>
            <TableHead className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">User</TableHead>
            <TableHead className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">Asset</TableHead>
            <TableHead className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">Type</TableHead>
            <TableHead className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">Status</TableHead>
            <TableHead className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">Amount</TableHead>
            <TableHead className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">USD</TableHead>
            <TableHead className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">EUR</TableHead>
            <TableHead className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.map((transaction) => (
            <TableRow key={transaction.id} className="text-[10px] sm:text-xs">
              <TableCell className="text-[10px] sm:text-xs px-2 sm:px-4">
                <div className="flex gap-0.5 sm:gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs p-0.5 sm:p-1 min-h-[28px] min-w-[28px] sm:min-h-[32px] sm:min-w-[32px]"
                    onClick={() => onViewDetails(transaction)}
                  >
                    <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs p-0.5 sm:p-1 min-h-[28px] min-w-[28px] sm:min-h-[32px] sm:min-w-[32px]"
                    onClick={() => onEditTransaction(transaction)}
                  >
                    <Edit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs p-0.5 sm:p-1 text-red-600 hover:text-red-700 min-h-[28px] min-w-[28px] sm:min-h-[32px] sm:min-w-[32px]"
                      >
                        <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="text-sm max-w-[90vw] sm:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-sm sm:text-base">Delete Transaction</AlertDialogTitle>
                        <AlertDialogDescription className="text-[10px] sm:text-xs">
                          Are you sure you want to delete this transaction? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="text-[10px] sm:text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => onDeleteTransaction(transaction.id)}
                          className="text-[10px] sm:text-xs bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
              <TableCell className="font-medium text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">
                ${formatNumber(portfolioBalances.get(transaction.user_id) || 0)}
              </TableCell>
              <TableCell className="text-[10px] sm:text-xs px-2 sm:px-4">
                <div className="min-w-0 flex items-center gap-1 sm:gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-[10px] sm:text-xs truncate text-white max-w-[80px] sm:max-w-none">
                      {extractUsername(transaction.user_profile?.email || '')}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[9px] sm:text-xs h-5 sm:h-6 px-1 sm:px-2 mt-0.5 sm:mt-1 text-white border-white/20 hover:bg-white/10"
                      onClick={() => copyUserUID(transaction.user_id)}
                    >
                      <Copy className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      <span className="hidden sm:inline">Copy UID</span>
                      <span className="sm:hidden">UID</span>
                    </Button>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-[10px] sm:text-xs px-2 sm:px-4">
                <Badge variant="outline" className="text-[9px] sm:text-xs whitespace-nowrap text-white border-white/20 px-1.5 sm:px-2">
                  {transaction.transaction_type === 'bank_transfer' 
                    ? 'EUR/USD' 
                    : (transaction.currency && transaction.currency.trim() ? transaction.currency : 'UNKNOWN')}
                </Badge>
              </TableCell>
              <TableCell className="text-[10px] sm:text-xs px-2 sm:px-4">
                <Badge className={`${getTypeColor(transaction.transaction_type)} text-[9px] sm:text-xs whitespace-nowrap px-1.5 sm:px-2`}>
                  {transaction.transaction_type}
                </Badge>
              </TableCell>
              <TableCell className="text-[10px] sm:text-xs px-2 sm:px-4">
                <Badge className={`${getStatusColor(transaction.status)} text-[9px] sm:text-xs whitespace-nowrap px-1.5 sm:px-2 font-medium`}>
                  {transaction.status}
                </Badge>
              </TableCell>
              <TableCell className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">
                {transaction.crypto_amount.toFixed(2)} {transaction.currency}
              </TableCell>
              <TableCell className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">${formatNumber(transaction.usd_amount_display || transaction.usd_amount)}</TableCell>
              <TableCell className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">€{formatNumber(transaction.cad_amount_display || transaction.usd_amount * 0.93)}</TableCell>
              <TableCell className="text-[10px] sm:text-xs whitespace-nowrap text-white px-2 sm:px-4">
                {new Date(transaction.transaction_date).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
