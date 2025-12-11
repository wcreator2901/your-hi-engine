
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLivePrices } from '@/hooks/useLivePrices';
import { UserProfile } from '@/types/adminTransactions';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddTransactionFormProps {
  users: UserProfile[] | undefined;
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ users }) => {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [transactionType, setTransactionType] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [eurAmount, setEurAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
  const [status, setStatus] = useState('pending');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 16));
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [showBankingDetails, setShowBankingDetails] = useState(false);
  const [bankingDetails, setBankingDetails] = useState({
    iban: '',
    recipientName: '',
    bicSwift: '',
    reference: '',
    currency: 'EUR'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Balance calculation states
  const [existingBalance, setExistingBalance] = useState<number>(0);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [updatedUsdValue, setUpdatedUsdValue] = useState<number>(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { prices } = useLivePrices();
  const queryClient = useQueryClient();

  // Exchange rates (mock data - in real app you'd fetch from an API)
  const exchangeRates = {
    USD: 1,
    EUR: 0.93
  };

  // Available crypto currencies instead of fiat currencies
  const availableCurrencies = [
    { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
    { code: 'USDT-ERC20', name: 'Tether (ERC20)', symbol: '₮' },
    { code: 'USDC-ERC20', name: 'USD Coin (ERC20)', symbol: '$' },
    { code: 'USDT_TRON', name: 'Tether (TRC20)', symbol: '₮' }
  ];

  // Filter users based on search term
  const filteredUsers = users?.filter(user => {
    const searchLower = userSearchTerm.toLowerCase();
    const fullName = user.full_name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    return fullName.includes(searchLower) || email.includes(searchLower);
  }) || [];

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCryptoPrice = (symbol: string): number => {
    // For stablecoins, always return 1.0
    if (symbol === 'USDT-ERC20' || symbol === 'USDC-ERC20' || symbol === 'USDT_TRON') {
      return 1.0;
    }
    
    // For other cryptos, get price from the live prices
    const cryptoMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum'
    };
    
    const cryptoId = cryptoMap[symbol] || symbol.toLowerCase();
    return prices[cryptoId] || 0;
  };

  // Fetch existing balance and calculate new balance
  useEffect(() => {
    const fetchBalanceAndCalculate = async () => {
      if (selectedUserId && selectedCurrency && cryptoAmount) {
        try {
          const { data: walletData, error } = await supabase
            .from('user_wallets')
            .select('balance_crypto')
            .eq('user_id', selectedUserId)
            .eq('asset_symbol', selectedCurrency)
            .maybeSingle();

          if (error) {
            console.error('Error fetching wallet balance:', error);
            return;
          }

          // Default to 0 if wallet doesn't exist yet
          const currentBalance = Number(walletData?.balance_crypto || 0);
          setExistingBalance(currentBalance);

          // Calculate new balance
          const transactionAmount = parseFloat(cryptoAmount) || 0;
          let calculatedNewBalance = currentBalance;

          if (transactionType === 'deposit') {
            calculatedNewBalance = currentBalance + transactionAmount;
          } else if (transactionType === 'withdrawal') {
            calculatedNewBalance = currentBalance - transactionAmount;
          }

          setNewBalance(calculatedNewBalance);

          // Calculate updated USD value
          const currentPrice = getCryptoPrice(selectedCurrency);
          const usdValue = calculatedNewBalance * currentPrice;
          setUpdatedUsdValue(usdValue);
        } catch (error) {
          console.error('Error fetching wallet balance:', error);
        }
      } else {
        // Reset balances if any required field is missing
        setExistingBalance(0);
        setNewBalance(0);
        setUpdatedUsdValue(0);
      }
    };

    fetchBalanceAndCalculate();
  }, [selectedUserId, selectedCurrency, cryptoAmount, transactionType, prices]);

  // Amount calculation handlers
  const handleCryptoAmountChange = (value: string) => {
    setCryptoAmount(value);
    if (value && selectedCurrency) {
      const currentPrice = getCryptoPrice(selectedCurrency);
      const usdValue = parseFloat(value) * currentPrice;
      const eurValue = usdValue * exchangeRates.EUR;
      
      setUsdAmount(usdValue.toFixed(2));
      setEurAmount(eurValue.toFixed(2));
    } else {
      setUsdAmount('');
      setEurAmount('');
    }
  };

  const handleEurAmountChange = (value: string) => {
    setEurAmount(value);
    if (value) {
      const eurValue = parseFloat(value);
      const usdValue = eurValue / exchangeRates.EUR;
      setUsdAmount(usdValue.toFixed(2));
      
      // Update crypto amount if asset is selected
      if (selectedAsset) {
        const currentPrice = getCryptoPrice(selectedAsset);
        if (currentPrice > 0) {
          const cryptoValue = usdValue / currentPrice;
          setCryptoAmount(cryptoValue.toFixed(6));
        }
      }
    } else {
      setUsdAmount('');
      setCryptoAmount('');
    }
  };

  const handleUsdAmountChange = (value: string) => {
    setUsdAmount(value);
    if (value) {
      const usdValue = parseFloat(value);
      const eurValue = usdValue * exchangeRates.EUR;
      setEurAmount(eurValue.toFixed(2));
      
      // Update crypto amount if asset is selected
      if (selectedAsset) {
        const currentPrice = getCryptoPrice(selectedAsset);
        if (currentPrice > 0) {
          const cryptoValue = usdValue / currentPrice;
          setCryptoAmount(cryptoValue.toFixed(6));
        }
      }
    } else {
      setEurAmount('');
      setCryptoAmount('');
    }
  };

  const handleTransactionTypeChange = (type: string) => {
    setTransactionType(type);
    setShowBankingDetails(type === 'bank_transfer');
    
    // Reset amounts when switching to/from bank_deposit
    if (type === 'bank_deposit') {
      setCryptoAmount('');
      setSelectedCurrency('EUR');
      setSelectedAsset('EUR');
    } else if (selectedCurrency === 'EUR') {
      setSelectedCurrency('BTC');
      setSelectedAsset('BTC');
    }
  };

  const handleUserSelect = (user: UserProfile) => {
    setSelectedUserId(user.user_id); // Use user_id instead of id
    setUserSearchOpen(false);
    setUserSearchTerm('');
  };

  const selectedUser = users?.find(user => user.user_id === selectedUserId);

  const resetAddTransactionForm = () => {
    setSelectedUserId('');
    setUserSearchTerm('');
    setSelectedAsset('BTC');
    setTransactionType('');
    setCryptoAmount('');
    setEurAmount('');
    setUsdAmount('');
    setSelectedCurrency('BTC');
    setStatus('completed'); // Default to completed per spec
    setTransactionDate(new Date().toISOString().slice(0, 16));
    setWithdrawalAddress('');
    setTransactionHash('');
    setShowBankingDetails(false);
    setBankingDetails({
      iban: '',
      recipientName: '',
      bicSwift: '',
      reference: '',
      currency: 'EUR'
    });
    setFormErrors({});
  };

  const addTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      console.log('Adding transaction with data:', transactionData);
      
      let newTransaction;
      
      // If it's a bank transfer, create banking details first
      if (showBankingDetails && transactionType === 'bank_transfer') {
        // First create the transaction
        const { data, error: transactionError } = await supabase
        .from('user_transactions')
          .insert([transactionData])
          .select()
          .single();

        if (transactionError) {
          console.error('Transaction error:', transactionError);
          throw transactionError;
        }

        newTransaction = data;

        // Then create the bank transfer details
        const { error: bankingError } = await supabase
          .from('bank_accounts')
          .insert([{
            transaction_id: newTransaction.id,
            iban: bankingDetails.iban,
            account_name: bankingDetails.recipientName,
            bic_swift: bankingDetails.bicSwift,
            reference: bankingDetails.reference,
            amount_fiat: parseFloat(selectedCurrency === 'USD' ? usdAmount : eurAmount),
            currency: bankingDetails.currency
          }]);

        if (bankingError) {
          console.error('Banking error:', bankingError);
          throw bankingError;
        }
      } else {
        // Regular transaction without banking details
        const { data, error } = await supabase
          .from('user_transactions')
          .insert([transactionData])
          .select()
          .single();

        if (error) {
          console.error('Transaction error:', error);
          throw error;
        }

        newTransaction = data;
      }

      // Sync wallet balance via edge function
      console.log('🔄 Calling sync-wallet-balance edge function...');
      const { error: syncError } = await supabase.functions.invoke('sync-wallet-balance', {
        body: { transaction: newTransaction }
      });

      if (syncError) {
        console.error('⚠️ Wallet sync error:', syncError);
        // Don't throw - transaction was created successfully, just log the sync error
      } else {
        console.log('✅ Wallet balance synced');
      }

      return newTransaction;
    },
    onSuccess: () => {
      // Immediately invalidate all wallet-related queries to force refetch
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-wallets'] }); // This is the key one for portfolio column
      queryClient.invalidateQueries({ queryKey: ['user-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-data'] });

      toast({
        title: "Success",
        description: "Transaction added and wallet synced successfully",
        duration: 1000,
      });
      setIsAddingTransaction(false);
      resetAddTransactionForm();
    },
    onError: (error: any) => {
      console.error('Add transaction error:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to add transaction: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    
    if (!selectedUserId) {
      errors.user = 'Please select a user';
    }
    if (!transactionType) {
      errors.type = 'Please select a transaction type';
    }

    // Bank deposit specific validation
    if (transactionType === 'bank_deposit') {
      if (!eurAmount || parseFloat(eurAmount) <= 0) {
        errors.eurAmount = 'EUR amount is required and must be greater than 0';
      }
    } else if (transactionType === 'bank_transfer') {
      // Bank transfer validation
      if (!eurAmount || parseFloat(eurAmount) <= 0) {
        errors.eurAmount = 'EUR amount is required and must be greater than 0';
      }
      if (!usdAmount || parseFloat(usdAmount) <= 0) {
        errors.usdAmount = 'USD amount is required and must be greater than 0';
      }
      if (!bankingDetails.iban) {
        errors.iban = 'IBAN is required';
      }
      if (!bankingDetails.recipientName) {
        errors.recipientName = 'Recipient name is required';
      }
      if (!bankingDetails.bicSwift) {
        errors.bicSwift = 'BIC/SWIFT code is required';
      }
      if (!bankingDetails.reference) {
        errors.reference = 'Reference is required';
      }
    } else {
      // Crypto transaction validation
      if (!selectedAsset) {
        errors.asset = 'Please select an asset';
      }
      if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) {
        errors.cryptoAmount = 'Crypto amount is required and must be greater than 0';
      }
      if (!usdAmount || parseFloat(usdAmount) <= 0) {
        errors.usdAmount = 'USD amount is required and must be greater than 0';
      }
    }

    // Additional validation for withdrawal transactions
    if (transactionType === 'withdrawal') {
      if (!withdrawalAddress || withdrawalAddress.trim().length === 0) {
        errors.withdrawalAddress = 'Withdrawal address is required for withdrawal transactions';
      } else {
        // Validate the withdrawal address format
        const { validateCryptoAddress } = await import('@/utils/cryptoAddressValidator');
        const addressValidation = validateCryptoAddress(withdrawalAddress, selectedAsset);
        if (!addressValidation.isValid) {
          errors.withdrawalAddress = addressValidation.error || 'Invalid withdrawal address format';
        }
      }
    }

    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors highlighted in the form",
        variant: "destructive",
      });
      return;
    }

    // Handle bank deposit - update EUR balance in user_bank_deposit_details
    if (transactionType === 'bank_deposit') {
      try {
        const eurValue = parseFloat(eurAmount);
        
        // First, check if user has existing bank deposit details
        const { data: existingDetails, error: fetchError } = await (supabase as any)
          .from('user_bank_deposit_details')
          .select('*')
          .eq('user_id', selectedUserId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching existing details:', fetchError);
          throw fetchError;
        }

        if (existingDetails) {
          // Update existing record - add to existing EUR balance
          const newEurBalance = (existingDetails.amount_eur || 0) + eurValue;
          const { error: updateError } = await (supabase as any)
            .from('user_bank_deposit_details')
            .update({
              amount_eur: newEurBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDetails.id);

          if (updateError) throw updateError;
        } else {
          // Create new record
          const { error: insertError } = await (supabase as any)
            .from('user_bank_deposit_details')
            .insert([{
              user_id: selectedUserId,
              amount_eur: eurValue,
              is_visible: true
            }]);

          if (insertError) throw insertError;
        }

        // Also create a transaction record for history
        const transactionData = {
          user_id: selectedUserId,
          currency: 'EUR',
          transaction_type: 'bank_deposit',
          amount: eurValue,
          amount_fiat: eurValue,
          status: status,
          created_at: transactionDate,
          transaction_hash: transactionHash || null
        };

        const { error: txError } = await supabase
          .from('user_transactions')
          .insert([transactionData]);

        if (txError) throw txError;

        queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
        
        toast({
          title: "Success",
          description: `Added €${eurValue.toFixed(2)} to user's EUR balance`,
          duration: 2000,
        });
        
        setIsAddingTransaction(false);
        resetAddTransactionForm();
        return;
      } catch (error: any) {
        console.error('Bank deposit error:', error);
        toast({
          title: "Error",
          description: `Failed to add bank deposit: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Regular crypto transaction
    const transactionData = {
      user_id: selectedUserId,
      currency: selectedAsset,
      transaction_type: transactionType,
      amount: parseFloat(cryptoAmount),
      status: status,
      created_at: transactionDate,
      transaction_hash: transactionHash || null,
      to_address: withdrawalAddress || null
    };

    console.log('Submitting transaction data:', transactionData);
    addTransactionMutation.mutate(transactionData);
  };

  return (
    <Dialog open={isAddingTransaction} onOpenChange={(open) => {
      setIsAddingTransaction(open);
      if (!open) resetAddTransactionForm();
    }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md shadow-sm text-xs sm:text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs sm:max-w-2xl lg:max-w-3xl text-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="text-base sm:text-2xl font-bold text-white">Add New Transaction</DialogTitle>
          <DialogDescription className="text-white/80 text-[0.7rem] sm:text-sm">Add a new transaction with full details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddTransaction} className="space-y-3 text-[0.7rem] sm:text-xs">
          {/* Step 1: User and Transaction Type Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="text-center sm:text-left">
              <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                User <span className="text-[#22C55E]">*</span>
              </label>
              <div className="relative" ref={dropdownRef}>
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full justify-between h-10 bg-slate-800 border-2 ${formErrors.user ? 'border-red-500' : 'border-slate-600'} text-white hover:bg-slate-700 hover:border-slate-500`}
                  onClick={() => setUserSearchOpen(!userSearchOpen)}
                >
                  {selectedUser ? (
                    <span className="text-white">{selectedUser.full_name || 'Unknown'}</span>
                  ) : (
                    <span className="text-white/60">Select user...</span>
                  )}
                  <ChevronDown className="h-4 w-4 shrink-0 text-white/60" />
                </Button>
                
                {userSearchOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border-2 border-slate-600 rounded-md shadow-xl max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-slate-600">
                      <Input
                        placeholder="Search users..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="h-9 bg-slate-700 border-slate-600 text-white placeholder:text-white/40"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <div className="p-3 text-sm text-white/60">No users found</div>
                      ) : (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center p-2 hover:bg-slate-700 cursor-pointer text-sm"
                            onClick={() => handleUserSelect(user)}
                          >
                            {selectedUserId === user.user_id && (
                              <Check className="mr-2 h-4 w-4 text-[#22C55E]" />
                            )}
                            <div className={selectedUserId === user.user_id ? "" : "ml-6"}>
                              <div className="font-medium text-white">{user.full_name || 'Unknown'}</div>
                              <div className="text-white/60">{user.email || 'No email'}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {formErrors.user && (
                <Alert variant="destructive" className="mt-2 bg-red-900/20 border-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-400">{formErrors.user}</AlertDescription>
                </Alert>
              )}
            </div>
            <div className="text-center sm:text-left">
              <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                Transaction Type <span className="text-[#22C55E]">*</span>
              </label>
              <Select value={transactionType} onValueChange={handleTransactionTypeChange} required>
                <SelectTrigger className={`h-10 bg-slate-800 border-2 ${formErrors.type ? 'border-red-500' : 'border-slate-600'} text-white hover:bg-slate-700`}>
                  <SelectValue placeholder="Select type" className="text-white placeholder:text-white/40" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-2 border-slate-600 z-[100]">
                  <SelectItem value="deposit" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Deposit</SelectItem>
                  <SelectItem value="withdrawal" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Withdrawal</SelectItem>
                  <SelectItem value="bank_deposit" className="text-green-400 hover:bg-slate-700 focus:bg-slate-700 focus:text-green-400">Bank Deposit (EUR)</SelectItem>
                  <SelectItem value="bank_transfer" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.type && (
                <Alert variant="destructive" className="mt-2 bg-red-900/20 border-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-400">{formErrors.type}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Step 2: Show remaining fields only after User and Transaction Type are selected */}
          {selectedUserId && transactionType && (
            <>
              {/* Bank Deposit (EUR) specific fields */}
              {transactionType === 'bank_deposit' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-700">
                  <div className="sm:col-span-2 p-4 bg-green-900/20 rounded-lg border-2 border-green-500/40">
                    <h4 className="text-sm font-bold text-green-400 mb-2">💶 EUR Bank Deposit</h4>
                    <p className="text-xs text-white/70">This will add to the user's EUR balance in the bank deposit details.</p>
                  </div>
                  
                  <div className="text-center sm:text-left">
                    <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                      EUR Amount <span className="text-[#22C55E]">*</span>
                    </label>
                    <div className="relative">
                      <Input 
                        value={eurAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEurAmount(value);
                          if (value) {
                            const eurValue = parseFloat(value);
                            const usdValue = eurValue / exchangeRates.EUR;
                            setUsdAmount(usdValue.toFixed(2));
                          } else {
                            setUsdAmount('');
                          }
                        }}
                        type="number" 
                        step="0.01" 
                        required
                        placeholder="Enter EUR amount"
                        className={`h-10 pl-8 bg-slate-800 border-2 ${formErrors.eurAmount ? 'border-red-500' : 'border-slate-600'} text-white placeholder:text-white/40`} 
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white font-medium">€</span>
                    </div>
                    {formErrors.eurAmount && (
                      <Alert variant="destructive" className="mt-2 bg-red-900/20 border-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-400">{formErrors.eurAmount}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="text-center sm:text-left">
                    <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                      USD Equivalent
                    </label>
                    <div className="relative">
                      <Input 
                        value={usdAmount}
                        readOnly
                        type="number" 
                        step="0.01" 
                        className="h-10 pl-8 bg-slate-700 border-2 border-slate-600 text-white/70 cursor-not-allowed" 
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 font-medium">$</span>
                    </div>
                    <div className="text-[0.65rem] sm:text-sm text-white/80 mt-1 text-center sm:text-left">
                      Exchange rate: 1 EUR = {(1/exchangeRates.EUR).toFixed(4)} USD
                    </div>
                  </div>

                  <div className="text-center sm:text-left">
                    <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-10 bg-slate-800 border-2 border-slate-600 text-white hover:bg-slate-700">
                        <SelectValue className="text-white" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-2 border-slate-600 z-[100]">
                        <SelectItem value="pending" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Pending</SelectItem>
                        <SelectItem value="processing" className="text-green-400 font-medium hover:bg-slate-700 focus:bg-slate-700 focus:text-green-400">Processing</SelectItem>
                        <SelectItem value="completed" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Completed</SelectItem>
                        <SelectItem value="failed" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-center sm:text-left">
                    <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                      Transaction Date <span className="text-[#22C55E]">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      required
                      className="h-10 bg-slate-800 border-2 border-slate-600 text-white [color-scheme:dark]"
                    />
                  </div>

                  <div className="sm:col-span-2 text-center sm:text-left">
                    <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                      Reference <span className="text-white/60">(optional)</span>
                    </label>
                    <Input
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                      placeholder="Enter bank reference or description"
                      className="h-10 bg-slate-800 border-2 border-slate-600 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
              ) : transactionType === 'bank_transfer' ? (
                /* Bank Transfer specific fields - no crypto fields */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-700">
                  <div className="sm:col-span-2 p-4 bg-blue-900/20 rounded-lg border-2 border-blue-500/40">
                    <h4 className="text-sm font-bold text-blue-400 mb-2">🏦 Bank Transfer</h4>
                    <p className="text-xs text-white/70">Create a bank transfer record for the user with banking details.</p>
                  </div>

                  {/* EUR Amount */}
                  <div className="text-center sm:text-left">
                    <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                      EUR Amount <span className="text-[#22C55E]">*</span>
                    </label>
                    <div className="relative">
                      <Input 
                        value={eurAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEurAmount(value);
                          if (value) {
                            const eurValue = parseFloat(value);
                            const usdValue = eurValue / exchangeRates.EUR;
                            setUsdAmount(usdValue.toFixed(2));
                          } else {
                            setUsdAmount('');
                          }
                        }}
                        type="number" 
                        step="0.01" 
                        required
                        placeholder="Enter EUR amount"
                        className={`h-10 pl-8 bg-slate-800 border-2 ${formErrors.eurAmount ? 'border-red-500' : 'border-slate-600'} text-white placeholder:text-white/40`} 
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white font-medium">€</span>
                    </div>
                    {formErrors.eurAmount && (
                      <Alert variant="destructive" className="mt-2 bg-red-900/20 border-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-400">{formErrors.eurAmount}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* USD Amount */}
                  <div className="text-center sm:text-left">
                    <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                      USD Amount <span className="text-[#22C55E]">*</span>
                    </label>
                    <div className="relative">
                      <Input 
                        value={usdAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          setUsdAmount(value);
                          if (value) {
                            const usdValue = parseFloat(value);
                            const eurValue = usdValue * exchangeRates.EUR;
                            setEurAmount(eurValue.toFixed(2));
                          } else {
                            setEurAmount('');
                          }
                        }}
                        type="number" 
                        step="0.01" 
                        required
                        placeholder="Enter USD amount"
                        className={`h-10 pl-8 bg-slate-800 border-2 ${formErrors.usdAmount ? 'border-red-500' : 'border-slate-600'} text-white placeholder:text-white/40`} 
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white font-medium">$</span>
                    </div>
                    <div className="text-[0.65rem] sm:text-sm text-white/80 mt-1 text-center sm:text-left">
                      Exchange rate: 1 EUR = {(1/exchangeRates.EUR).toFixed(4)} USD
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-center sm:text-left">
                    <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-10 bg-slate-800 border-2 border-slate-600 text-white hover:bg-slate-700">
                        <SelectValue className="text-white" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-2 border-slate-600 z-[100]">
                        <SelectItem value="pending" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Pending</SelectItem>
                        <SelectItem value="processing" className="text-blue-400 font-medium hover:bg-slate-700 focus:bg-slate-700 focus:text-blue-400">Processing</SelectItem>
                        <SelectItem value="completed" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Completed</SelectItem>
                        <SelectItem value="failed" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transaction Date */}
                  <div className="text-center sm:text-left">
                    <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                      Transaction Date <span className="text-[#22C55E]">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      required
                      className="h-10 bg-slate-800 border-2 border-slate-600 text-white [color-scheme:dark]"
                    />
                  </div>

                  {/* Banking Details Section */}
                  <div className="sm:col-span-2 border-t border-slate-700 pt-4 mt-2">
                    <h4 className="font-bold text-white text-sm sm:text-base mb-3">Banking Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="text-center sm:text-left">
                        <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                          IBAN <span className="text-[#22C55E]">*</span>
                        </label>
                        <Input
                          value={bankingDetails.iban}
                          onChange={(e) => setBankingDetails({...bankingDetails, iban: e.target.value})}
                          className="h-10 bg-slate-800 border-2 border-slate-600 text-white placeholder:text-white/40"
                          placeholder="Enter IBAN"
                          required
                        />
                      </div>
                      <div className="text-center sm:text-left">
                        <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                          Recipient's Full Name <span className="text-[#22C55E]">*</span>
                        </label>
                        <Input
                          value={bankingDetails.recipientName}
                          onChange={(e) => setBankingDetails({...bankingDetails, recipientName: e.target.value})}
                          className="h-10 bg-slate-800 border-2 border-slate-600 text-white placeholder:text-white/40"
                          placeholder="Enter recipient's full name"
                          required
                        />
                      </div>
                      <div className="text-center sm:text-left">
                        <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                          BIC/SWIFT Code <span className="text-[#22C55E]">*</span>
                        </label>
                        <Input
                          value={bankingDetails.bicSwift}
                          onChange={(e) => setBankingDetails({...bankingDetails, bicSwift: e.target.value})}
                          className="h-10 bg-slate-800 border-2 border-slate-600 text-white placeholder:text-white/40"
                          placeholder="Enter BIC/SWIFT code"
                          required
                        />
                      </div>
                      <div className="text-center sm:text-left">
                        <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                          Reference/Description <span className="text-[#22C55E]">*</span>
                        </label>
                        <Input
                          value={bankingDetails.reference}
                          onChange={(e) => setBankingDetails({...bankingDetails, reference: e.target.value})}
                          className="h-10 bg-slate-800 border-2 border-slate-600 text-white placeholder:text-white/40"
                          placeholder="Enter payment reference"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular crypto transaction fields */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-700">
                <div className="text-center sm:text-left">
                  <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                    Crypto Currency <span className="text-[#22C55E]">*</span>
                  </label>
                  <Select value={selectedCurrency} onValueChange={(value) => {
                    setSelectedCurrency(value);
                    setSelectedAsset(value);
                    // Recalculate amounts when currency changes
                    if (cryptoAmount) {
                      const currentPrice = getCryptoPrice(value);
                      const usdValue = parseFloat(cryptoAmount) * currentPrice;
                      const eurValue = usdValue * exchangeRates.EUR;
                      setUsdAmount(usdValue.toFixed(2));
                      setEurAmount(eurValue.toFixed(2));
                    }
                  }}>
                    <SelectTrigger className={`h-10 bg-slate-800 border-2 ${formErrors.asset ? 'border-red-500' : 'border-slate-600'} text-white hover:bg-slate-700`}>
                      <SelectValue placeholder="Select crypto" className="text-white placeholder:text-white/40" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-2 border-slate-600 z-[100]">
                      {availableCurrencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code} className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">
                          {currency.symbol} {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.asset && (
                    <Alert variant="destructive" className="mt-2 bg-red-900/20 border-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-400">{formErrors.asset}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                    Crypto Amount <span className="text-[#22C55E]">*</span>
                  </label>
                  <Input 
                    value={cryptoAmount}
                    onChange={(e) => handleCryptoAmountChange(e.target.value)}
                    type="number" 
                    step="0.000001" 
                    required 
                    className={`h-10 bg-slate-800 border-2 ${formErrors.cryptoAmount ? 'border-red-500' : 'border-slate-600'} text-white placeholder:text-white/40`} 
                  />
                  {formErrors.cryptoAmount && (
                    <Alert variant="destructive" className="mt-2 bg-red-900/20 border-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-400">{formErrors.cryptoAmount}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">EUR Amount</label>
                  <div className="relative">
                    <Input 
                      value={eurAmount}
                      onChange={(e) => handleEurAmountChange(e.target.value)}
                      type="number" 
                      step="0.01" 
                      className="h-10 pl-8 bg-slate-800 border-2 border-slate-600 text-white placeholder:text-white/40" 
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white font-medium">€</span>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                    USD Amount <span className="text-[#22C55E]">*</span>
                  </label>
                  <div className="relative">
                    <Input 
                      value={usdAmount}
                      onChange={(e) => handleUsdAmountChange(e.target.value)}
                      type="number" 
                      step="0.01" 
                      required 
                      className={`h-10 pl-8 bg-slate-800 border-2 ${formErrors.usdAmount ? 'border-red-500' : 'border-slate-600'} text-white placeholder:text-white/40`} 
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white font-medium">$</span>
                  </div>
                  <div className="text-[0.65rem] sm:text-sm text-white/80 mt-1 text-center sm:text-left">
                    Exchange rate: 1 EUR = {(1/exchangeRates.EUR).toFixed(4)} USD
                  </div>
                  {formErrors.usdAmount && (
                    <Alert variant="destructive" className="mt-2 bg-red-900/20 border-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-400">{formErrors.usdAmount}</AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Balance Calculation - Show for deposit/withdrawal */}
                {(transactionType === 'deposit' || transactionType === 'withdrawal') && selectedUserId && selectedCurrency && (
                  <div className="sm:col-span-2 space-y-3 p-4 bg-slate-900/50 rounded-lg border-2 border-slate-700">
                    <h4 className="text-sm font-bold text-white">Balance Calculation</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/80">Existing Balance</label>
                        <div className="h-10 flex items-center px-4 rounded-md bg-white/10 border-2 border-white/20 text-white font-mono">
                          {existingBalance.toFixed(8)} {selectedCurrency}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/80">New Balance</label>
                        <div className={`h-10 flex items-center px-4 rounded-md border-2 text-white font-mono font-bold ${
                          transactionType === 'deposit' ? 'bg-primary/20 border-primary/40' : 'bg-primary/10 border-primary/30'
                        }`}>
                          {newBalance.toFixed(8)} {selectedCurrency}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/80">Updated USD Value</label>
                        <div className="h-10 flex items-center px-4 rounded-md bg-blue-500/20 border-2 border-blue-500/40 text-white font-mono font-bold">
                          ${updatedUsdValue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status - Only show for deposits */}
                {transactionType !== 'withdrawal' && transactionType !== 'bank_deposit' && transactionType !== 'bank_transfer' && (
                  <div className="text-center sm:text-left">
                    <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-10 bg-slate-800 border-2 border-slate-600 text-white hover:bg-slate-700">
                        <SelectValue className="text-white" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-2 border-slate-600 z-[100]">
                        <SelectItem value="pending" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Pending</SelectItem>
                        <SelectItem value="processing" className="text-green-400 font-medium hover:bg-slate-700 focus:bg-slate-700 focus:text-green-400">Processing</SelectItem>
                        <SelectItem value="completed" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Completed</SelectItem>
                        <SelectItem value="failed" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Failed</SelectItem>
                        <SelectItem value="cancelled" className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="sm:col-span-2 text-center sm:text-left">
                  <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                    Transaction Date <span className="text-[#22C55E]">*</span>
                  </label>
                  <Input
                    type="datetime-local"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    required
                    className="h-10 bg-slate-800 border-2 border-slate-600 text-white [color-scheme:dark]"
                  />
                  <p className="text-[0.65rem] sm:text-xs text-white/60 mt-1 text-center sm:text-left">When the transaction occurred (defaults to current date/time)</p>
                </div>

                {/* Withdrawal Address - Only for withdrawals */}
                {transactionType === 'withdrawal' && (
                  <div className="sm:col-span-2 text-center sm:text-left">
                    <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                      Withdrawal Address <span className="text-[#22C55E]">*</span>
                    </label>
                    <Input
                      value={withdrawalAddress}
                      onChange={(e) => setWithdrawalAddress(e.target.value)}
                      placeholder="Enter withdrawal address"
                      className={`h-10 bg-slate-800 border-2 ${formErrors.withdrawalAddress ? 'border-red-500' : 'border-slate-600'} text-white placeholder:text-white/40`}
                    />
                    {formErrors.withdrawalAddress && (
                      <Alert variant="destructive" className="mt-2 bg-red-900/20 border-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-400">{formErrors.withdrawalAddress}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Transaction Hash - Optional for all types */}
                <div className="sm:col-span-2 text-center sm:text-left">
                  <label className="block text-[0.7rem] sm:text-sm font-bold text-white mb-2">
                    Transaction Hash <span className="text-white/60">(optional)</span>
                  </label>
                  <Input
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    placeholder="Enter transaction hash if available"
                    className={`h-10 bg-slate-800 border-2 ${formErrors.transactionHash ? 'border-red-500' : 'border-slate-600'} text-white placeholder:text-white/40`}
                  />
                  {formErrors.transactionHash && (
                    <Alert variant="destructive" className="mt-2 bg-red-900/20 border-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-400">{formErrors.transactionHash}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              )}

            </>
          )}
          {/* Action Buttons - Different for withdrawal */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
            <Button type="button" variant="outline" onClick={() => setIsAddingTransaction(false)} className="h-10 bg-slate-800 border-2 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500">
              Cancel
            </Button>
            {transactionType === 'withdrawal' ? (
              <>
                <Button 
                  type="submit" 
                  className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold" 
                  disabled={addTransactionMutation.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddTransaction(e);
                  }}
                >
                  {addTransactionMutation.isPending ? 'Saving...' : 'Save Transaction and Balance'}
                </Button>
                <Button 
                  type="button" 
                  className="h-10 bg-red-600 hover:bg-red-700 text-white font-bold"
                  onClick={() => {
                    // Set status to failed and submit
                    setStatus('failed');
                    setTimeout(() => {
                      const formEvent = new Event('submit') as any;
                      handleAddTransaction(formEvent);
                    }, 0);
                  }}
                >
                  Deny
                </Button>
              </>
            ) : (
              <Button type="submit" className="h-10 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold" disabled={addTransactionMutation.isPending}>
                {addTransactionMutation.isPending ? 'Saving...' : transactionType === 'deposit' ? 'Save Transaction and Balance' : 'Save Transaction'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
