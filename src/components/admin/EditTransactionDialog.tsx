import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Transaction } from '@/types/adminTransactions';
import { useLivePrices } from '@/hooks/useLivePrices';
import { toast } from '@/hooks/use-toast';
import btcLogo from '@/assets/btc-logo.png';
import ethereumGif from '@/assets/ethereum.gif';
import usdtLogo from '@/assets/usdt-logo-new.png';
import usdcLogo from '@/assets/usdc-logo.png';
import usdtTrc20Logo from '@/assets/usdt-trc20-logo.png';

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updatedTransaction: any) => void;
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  transaction,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [assetSymbol, setAssetSymbol] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [eurAmount, setEurAmount] = useState('');
  const [status, setStatus] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  
  // Bank transfer specific fields
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [institutionNumber, setInstitutionNumber] = useState('');
  const [transitNumber, setTransitNumber] = useState('');
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [bankTransferCrypto, setBankTransferCrypto] = useState(''); // Require explicit selection for bank transfers

  // Balance management fields
  const [existingBalance, setExistingBalance] = useState<number>(0);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [updatedUsdValue, setUpdatedUsdValue] = useState<number>(0);

  const { prices } = useLivePrices();

  // Exchange rates (mock data - in real app you'd fetch from an API)
  const exchangeRates = {
    USD: 1,
    EUR: 0.93
  };

  // Get crypto price from live prices
  const getCryptoPrice = (symbol: string): number => {
    // For stablecoins, always return 1.0
    if (symbol === 'USDT-ERC20' || symbol === 'USDC-ERC20' || symbol === 'USDT_TRON') {
      return 1.0;
    }
    
    // For other cryptos, get price from the live prices
    const cryptoMap: { [key: string]: string } = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum'
    };
    
    const cryptoId = cryptoMap[symbol] || symbol.toLowerCase();
    return prices[cryptoId] || 0;
  };

  const toFixed2String = (val: number | string | undefined | null) => {
    const n = typeof val === 'string' ? parseFloat(val) : Number(val ?? 0);
    if (isNaN(n)) return '';
    return Number(n.toFixed(2)).toString();
  };

  // Update state when transaction changes or dialog opens
  useEffect(() => {
    if (transaction && isOpen) {
      setAssetSymbol(transaction.asset_symbol || '');
      setTransactionType(transaction.transaction_type || '');
      setCryptoAmount(transaction.crypto_amount !== undefined && transaction.crypto_amount !== null
        ? Number(transaction.crypto_amount).toString()
        : '');
      setUsdAmount(toFixed2String(transaction.usd_amount));
      setEurAmount(toFixed2String(transaction.cad_amount_display));
      setStatus(transaction.status || '');
      setTransactionDate(new Date(transaction.transaction_date).toISOString().slice(0, 16));
      setWithdrawalAddress(transaction.to_address || '');
      setTransactionHash(transaction.transaction_hash || '');
    }
  }, [transaction, isOpen]);

  // Fetch bank transfer details when transaction is a bank transfer
  useEffect(() => {
    const fetchBankTransferDetails = async () => {
      if (transaction && transaction.transaction_type === 'bank_transfer' && isOpen) {
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('transaction_id', transaction.id)
          .maybeSingle();
        
        if (!error && data) {
          setAccountNumber(data.account_number || '');
          setAccountName(data.account_name || '');
          setEmailOrMobile(data.email_or_mobile || '');
          
          // Parse BSB number (format: "institution-transit")
          const bsbParts = (data.bsb_number || '').split('-');
          setInstitutionNumber(bsbParts[0] || '');
          setTransitNumber(bsbParts[1] || '');
          
          // Set EUR amount from bank transfer
          setEurAmount(data.amount_fiat?.toString() || '');
          // Calculate USD from EUR
          if (data.amount_fiat) {
            const usdValue = (data.amount_fiat / exchangeRates.EUR).toFixed(2);
            setUsdAmount(usdValue);
          }
        }
      }
    };
    
    fetchBankTransferDetails();
  }, [transaction, isOpen]);

  // Fetch existing wallet balance and calculate new balance
  useEffect(() => {
    const fetchBalanceAndCalculate = async () => {
      if (!transaction || !isOpen || !transaction.user_id) return;

      // Determine which crypto to use
      const targetCrypto = transactionType === 'bank_transfer' ? bankTransferCrypto : assetSymbol;
      
      if (!targetCrypto) return;

      try {
        // Fetch current wallet balance using edge function (bypasses RLS for admins)
        const { data: balanceResp, error } = await supabase.functions.invoke('get-wallet-balance', {
          body: {
            user_id: transaction.user_id,
            asset_symbol: targetCrypto,
          }
        });

        if (!error && balanceResp) {
          const currentBalance = balanceResp.balance_crypto || 0;
          setExistingBalance(currentBalance);

          // Calculate crypto amount for bank transfers
          let newTransactionAmount = parseFloat(cryptoAmount) || 0;
          
          if (transactionType === 'bank_transfer') {
            // Convert USD to crypto amount using the bank transfer crypto
            const usdValue = parseFloat(usdAmount) || 0;
            const currentPrice = getCryptoPrice(bankTransferCrypto);
            if (currentPrice > 0 && usdValue > 0) {
              newTransactionAmount = usdValue / currentPrice;
              setCryptoAmount(newTransactionAmount.toFixed(8));
            }
          }

          // Get original transaction amount (what's already in the balance)
          const originalAmount = parseFloat(transaction.crypto_amount?.toString() || '0');

          // Determine whether the original transaction has already affected the balance
          const originalType = transaction.transaction_type;
          const wasApplied = transaction.status === 'completed';
          const willApply = status === 'completed';

          // Step 1: Start from the current wallet balance
          let calculatedNewBalance = currentBalance;

          // Step 2: If original transaction was 'completed', reverse it to get the pre-transaction balance
          if (wasApplied) {
            if (originalType === 'deposit') {
              calculatedNewBalance -= originalAmount;
            } else if (originalType === 'withdrawal' || originalType === 'bank_transfer') {
              calculatedNewBalance += originalAmount;
            }
          }

          // Step 3: Apply NEW transaction values if status is 'completed'
          // This shows what the balance WILL BE after the update is submitted
          if (willApply) {
            if (transactionType === 'deposit') {
              calculatedNewBalance += newTransactionAmount;
            } else if (transactionType === 'withdrawal' || transactionType === 'bank_transfer') {
              calculatedNewBalance -= newTransactionAmount;
            }
          }

          // Step 4: Round to avoid floating point errors - treat very small numbers as 0
          if (calculatedNewBalance < 0.00000001 && calculatedNewBalance > -0.00000001) {
            calculatedNewBalance = 0;
          }

          setNewBalance(calculatedNewBalance);

          // Calculate updated USD value based on the NEW balance
          const currentPrice = getCryptoPrice(targetCrypto);
          const usdValue = calculatedNewBalance * currentPrice;
          setUpdatedUsdValue(usdValue);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    };

    fetchBalanceAndCalculate();
  }, [transaction, isOpen, assetSymbol, cryptoAmount, transactionType, bankTransferCrypto, usdAmount, eurAmount, status, prices]);

  // Auto-recalc USD/EUR when crypto amount, asset, or prices change (non-bank transfers)
  useEffect(() => {
    if (transactionType === 'bank_transfer') return;
    if (!cryptoAmount || !assetSymbol) return;
    const numValue = parseFloat(cryptoAmount);
    if (isNaN(numValue)) return;
    const currentPrice = getCryptoPrice(assetSymbol);
    if (currentPrice <= 0) return;
    const usdValue = numValue * currentPrice;
    const eurValue = usdValue * exchangeRates.EUR;
    setUsdAmount(Number(usdValue.toFixed(2)).toString());
    setEurAmount(Number(eurValue.toFixed(2)).toString());
  }, [cryptoAmount, assetSymbol, prices, transactionType]);

  // Handle crypto amount change
  const handleCryptoAmountChange = (value: string): void => {
    setCryptoAmount(value);
    if (value && assetSymbol && prices) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const currentPrice = getCryptoPrice(assetSymbol);
        if (currentPrice > 0) {
          const usdValue = numValue * currentPrice;
          const eurValue = usdValue * exchangeRates.EUR;
          setUsdAmount(Number(usdValue.toFixed(2)).toString());
          setEurAmount(Number(eurValue.toFixed(2)).toString());
        }
      }
    }
  };

  // Handle USD amount change
  const handleUsdAmountChange = (value: string): void => {
    setUsdAmount(value);
    if (value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const roundedUsd = Number(numValue.toFixed(2));
        const eurValue = roundedUsd * exchangeRates.EUR;
        setUsdAmount(roundedUsd.toFixed(2));
        setEurAmount(Number(eurValue.toFixed(2)).toString());
        
        if (assetSymbol && prices) {
          const currentPrice = getCryptoPrice(assetSymbol);
          if (currentPrice > 0) {
            const cryptoValue = roundedUsd / currentPrice;
            setCryptoAmount(Number(cryptoValue.toFixed(8)).toString());
          }
        }
      }
    }
  };

  // Handle EUR amount change
  const handleEurAmountChange = (value: string): void => {
    setEurAmount(value);
    if (value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const usdValue = numValue / exchangeRates.EUR;
        setUsdAmount(Number(usdValue.toFixed(2)).toString());
        
        if (transactionType !== 'bank_transfer' && assetSymbol && prices) {
          const currentPrice = getCryptoPrice(assetSymbol);
          if (currentPrice > 0) {
            const cryptoValue = usdValue / currentPrice;
            setCryptoAmount(Number(cryptoValue.toFixed(8)).toString());
          }
        }
      }
    }
  };

  // Handle update with balance update
  const handleUpdateWithBalance = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!transaction) return;
    
    try {
      if (transactionType === 'bank_transfer') {
        // Update bank transfer transaction
        const { error: transactionError } = await supabase
          .from('user_transactions')
          .update({
            status: status,
            created_at: transactionDate,
            amount: parseFloat(eurAmount) || 0,
          })
          .eq('id', transaction.id);

        if (transactionError) throw transactionError;

        // Update bank account details
        const { error: bankError } = await supabase
          .from('bank_accounts')
          .update({
            account_number: accountNumber,
            account_name: accountName,
            bsb_number: `${institutionNumber}-${transitNumber}`,
            email_or_mobile: emailOrMobile,
            amount_fiat: parseFloat(eurAmount) || 0,
          })
          .eq('transaction_id', transaction.id);

        if (bankError) throw bankError;

        // Only sync wallet if status changed from non-completed to completed
        const statusChangedToCompleted = transaction.status !== 'completed' && status === 'completed';
        if (statusChangedToCompleted) {
          const { error: syncError } = await supabase.functions.invoke('sync-wallet-balance', {
            body: {
              transaction: {
                id: transaction.id,
                user_id: transaction.user_id,
                currency: bankTransferCrypto,
                transaction_type: transactionType,
                amount: parseFloat(cryptoAmount) || 0,
                status: status
              }
            }
          });

          if (syncError) {
            console.error('Error syncing wallet balance:', syncError);
            toast({
              title: 'Warning',
              description: 'Transaction updated but wallet sync failed. Please refresh.',
              variant: 'destructive',
            });
          }
        }

        const updatedTransaction = {
          ...transaction,
          status: status,
          transaction_date: transactionDate,
          crypto_amount: parseFloat(eurAmount) || 0,
        };
        
        onSubmit(updatedTransaction);
      } else {
        // Update crypto transaction
        const { error: transactionError } = await supabase
          .from('user_transactions')
          .update({
            currency: assetSymbol,
            transaction_type: transactionType,
            amount: parseFloat(cryptoAmount) || 0,
            status: status,
            created_at: transactionDate,
            to_address: withdrawalAddress,
            transaction_hash: transactionHash
          })
          .eq('id', transaction.id);

        if (transactionError) throw transactionError;

        // Only sync wallet if status changed from non-completed to completed
        const statusChangedToCompleted = transaction.status !== 'completed' && status === 'completed';
        if (statusChangedToCompleted) {
          const { error: syncError } = await supabase.functions.invoke('sync-wallet-balance', {
            body: {
              transaction: {
                id: transaction.id,
                user_id: transaction.user_id,
                currency: assetSymbol,
                transaction_type: transactionType,
                amount: parseFloat(cryptoAmount) || 0,
                status: status
              }
            }
          });

          if (syncError) {
            console.error('Error syncing wallet balance:', syncError);
            toast({
              title: 'Warning',
              description: 'Transaction updated but wallet sync failed. Please refresh.',
              variant: 'destructive',
            });
          }
        }

        const updatedTransaction = {
          ...transaction,
          asset_symbol: assetSymbol,
          transaction_type: transactionType,
          crypto_amount: parseFloat(cryptoAmount) || 0,
          usd_amount: parseFloat(usdAmount) || 0,
          cad_amount_display: parseFloat(eurAmount) || 0,
          status: status,
          transaction_date: transactionDate,
          to_address: withdrawalAddress,
          transaction_hash: transactionHash
        };
        
        onSubmit(updatedTransaction);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle deny action for withdrawal/bank transfer
  const handleDeny = async (): Promise<void> => {
    if (!transaction) return;
    
    try {
      const { error } = await supabase
        .from('user_transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      if (error) throw error;

      const updatedTransaction = {
        ...transaction,
        status: 'failed'
      };
      
      onSubmit(updatedTransaction);
    } catch (error) {
      console.error('Error denying transaction:', error);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-bold text-white">Edit Transaction</DialogTitle>
          <DialogDescription className="text-white">Edit transaction details with live currency conversion</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleUpdateWithBalance} className="space-y-4">
          {/* Transaction Type - Always visible */}
          <div className="space-y-2">
            <Label htmlFor="transaction_type" className="text-xs sm:text-sm font-bold text-white">Transaction Type</Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className="h-12 text-sm border-2 border-amber-700 text-black bg-white" style={{ WebkitTextFillColor: '#000', color: '#000' }}>
                <SelectValue placeholder="Select type" className="text-black" />
              </SelectTrigger>
              <SelectContent className="bg-white z-[200] text-black">
                <SelectItem value="deposit" className="text-black focus:text-black data-[state=checked]:text-black">Deposit</SelectItem>
                <SelectItem value="withdrawal" className="text-black focus:text-black data-[state=checked]:text-black">Withdrawal</SelectItem>
                <SelectItem value="buy" className="text-black focus:text-black data-[state=checked]:text-black">Buy</SelectItem>
                <SelectItem value="sell" className="text-black focus:text-black data-[state=checked]:text-black">Sell</SelectItem>
                <SelectItem value="bank_transfer" className="text-black focus:text-black data-[state=checked]:text-black">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Transfer Fields */}
          {transactionType === 'bank_transfer' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_name" className="text-xs sm:text-sm font-bold text-white">Account Name</Label>
                  <Input
                    id="account_name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black"
                    placeholder="Enter account holder name"
                    style={{ WebkitTextFillColor: '#000', color: '#000' }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="account_number" className="text-xs sm:text-sm font-bold text-white">Account Number</Label>
                  <Input
                    id="account_number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black"
                    placeholder="Enter account number"
                    style={{ WebkitTextFillColor: '#000', color: '#000' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="institution_number" className="text-xs sm:text-sm font-bold text-white">Institution Number</Label>
                  <Input
                    id="institution_number"
                    value={institutionNumber}
                    onChange={(e) => setInstitutionNumber(e.target.value)}
                    className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black"
                    placeholder="Enter institution number"
                    style={{ WebkitTextFillColor: '#000', color: '#000' }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transit_number" className="text-xs sm:text-sm font-bold text-white">Transit Number (Branch Number)</Label>
                  <Input
                    id="transit_number"
                    value={transitNumber}
                    onChange={(e) => setTransitNumber(e.target.value)}
                    className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black"
                    placeholder="Enter transit number"
                    style={{ WebkitTextFillColor: '#000', color: '#000' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_or_mobile" className="text-xs sm:text-sm font-bold text-white">Email or Mobile Number</Label>
                <Input
                  id="email_or_mobile"
                  value={emailOrMobile}
                  onChange={(e) => setEmailOrMobile(e.target.value)}
                  className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black"
                  placeholder="Enter email or mobile number"
                  style={{ WebkitTextFillColor: '#000', color: '#000' }}
                />
              </div>

              {/* Crypto Currency Selection for Bank Transfer */}
              <div className="space-y-2">
                <Label htmlFor="bank_transfer_crypto" className="text-xs sm:text-sm font-bold text-white">Deduct From Crypto</Label>
                <Select value={bankTransferCrypto} onValueChange={setBankTransferCrypto}>
                  <SelectTrigger className="h-12 text-sm border-2 border-amber-700 text-black bg-white" style={{ WebkitTextFillColor: '#000', color: '#000' }}>
                    <SelectValue placeholder="Select crypto" className="text-black" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[200] text-black">
                    <SelectItem value="BTC" className="text-black focus:text-black data-[state=checked]:text-black">
                      <div className="flex items-center gap-2">
                        <img src={btcLogo} alt="BTC" className="w-5 h-5" />
                        <span>BTC</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ETH" className="text-black focus:text-black data-[state=checked]:text-black">
                      <div className="flex items-center gap-2">
                        <img src={ethereumGif} alt="ETH" className="w-5 h-5" />
                        <span>ETH</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="USDT-ERC20" className="text-black focus:text-black data-[state=checked]:text-black">
                      <div className="flex items-center gap-2">
                        <img src={usdtLogo} alt="USDT" className="w-5 h-5" />
                        <span>USDT [ERC20]</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="USDC-ERC20" className="text-black focus:text-black data-[state=checked]:text-black">
                      <div className="flex items-center gap-2">
                        <img src={usdcLogo} alt="USDC" className="w-5 h-5" />
                        <span>USDC [ERC20]</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="USDT_TRON" className="text-black focus:text-black data-[state=checked]:text-black">
                      <div className="flex items-center gap-2">
                        <img src={usdtTrc20Logo} alt="USDT TRC20" className="w-5 h-5" />
                        <span>USDT [TRC20]</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eur_amount" className="text-xs sm:text-sm font-bold text-white">Amount (EUR)</Label>
                  <Input
                    id="eur_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={eurAmount}
                    onChange={(e) => handleEurAmountChange(e.target.value)}
                    onBlur={(e) => setEurAmount(toFixed2String(e.target.value))}
                    inputMode="decimal"
                    className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                    style={{ WebkitTextFillColor: '#000', color: '#000' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usd_amount" className="text-xs sm:text-sm font-bold text-white">Amount (USD)</Label>
                  <Input
                    id="usd_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={usdAmount}
                    onChange={(e) => handleUsdAmountChange(e.target.value)}
                    onBlur={(e) => setUsdAmount(toFixed2String(e.target.value))}
                    inputMode="decimal"
                    className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                    style={{ WebkitTextFillColor: '#000', color: '#000' }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Crypto Transaction Fields */}
              <div className="space-y-2">
                <Label htmlFor="asset_symbol" className="text-xs sm:text-sm font-bold text-white">Asset Symbol</Label>
                <Select value={assetSymbol} onValueChange={setAssetSymbol}>
                  <SelectTrigger className="h-12 text-sm border-2 border-amber-700 text-black bg-white" style={{ WebkitTextFillColor: '#000', color: '#000' }}>
                    <SelectValue placeholder="Select asset" className="text-black" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[200] text-black">
                    <SelectItem value="BTC" className="text-black focus:text-black data-[state=checked]:text-black">
                      <div className="flex items-center gap-2">
                        <img src={btcLogo} alt="BTC" className="w-5 h-5" />
                        <span>BTC</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ETH" className="text-black focus:text-black data-[state=checked]:text-black">
                      <div className="flex items-center gap-2">
                        <img src={ethereumGif} alt="ETH" className="w-5 h-5" />
                        <span>ETH</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="USDT-ERC20" className="text-black focus:text-black data-[state=checked]:text-black">
                      <div className="flex items-center gap-2">
                        <img src={usdtLogo} alt="USDT" className="w-5 h-5" />
                        <span>USDT [ERC20]</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="USDC-ERC20" className="text-black focus:text-black data-[state=checked]:text-black">
                      <div className="flex items-center gap-2">
                        <img src={usdcLogo} alt="USDC" className="w-5 h-5" />
                        <span>USDC [ERC20]</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="USDT_TRON" className="text-black focus:text-black data-[state=checked]:text-black">
                      <div className="flex items-center gap-2">
                        <img src={usdtTrc20Logo} alt="USDT TRC20" className="w-5 h-5" />
                        <span>USDT [TRC20]</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crypto_amount" className="text-xs sm:text-sm font-bold text-white">Crypto Amount</Label>
                  <Input
                    id="crypto_amount"
                    type="number"
                    min="0"
                    step="0.000001"
                    value={cryptoAmount}
                    onChange={(e) => handleCryptoAmountChange(e.target.value)}
                    inputMode="decimal"
                    className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="1"
                    style={{ WebkitTextFillColor: '#000', color: '#000' }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="usd_amount_crypto" className="text-xs sm:text-sm font-bold text-white">USD Amount</Label>
                  <Input
                    id="usd_amount_crypto"
                    type="number"
                    min="0"
                    step="0.01"
                    value={usdAmount}
                    onChange={(e) => handleUsdAmountChange(e.target.value)}
                    onBlur={(e) => setUsdAmount(toFixed2String(e.target.value))}
                    inputMode="decimal"
                    className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                    style={{ WebkitTextFillColor: '#000', color: '#000' }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="eur_amount_crypto" className="text-xs sm:text-sm font-bold text-white">EUR Amount</Label>
                  <Input
                    id="eur_amount_crypto"
                    type="number"
                    min="0"
                    step="0.01"
                    value={eurAmount}
                    onChange={(e) => handleEurAmountChange(e.target.value)}
                    onBlur={(e) => setEurAmount(toFixed2String(e.target.value))}
                    inputMode="decimal"
                    className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00"
                    style={{ WebkitTextFillColor: '#000', color: '#000' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdrawal_address" className="text-xs sm:text-sm font-bold text-white">Withdrawal Address (optional)</Label>
                <Input
                  id="withdrawal_address"
                  value={withdrawalAddress}
                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                  className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black"
                  placeholder="Enter withdrawal address if applicable"
                  style={{ WebkitTextFillColor: '#000', color: '#000' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_hash" className="text-xs sm:text-sm font-bold text-white">Transaction Hash (optional)</Label>
                <Input
                  id="transaction_hash"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black"
                  placeholder="Enter transaction hash if available"
                  style={{ WebkitTextFillColor: '#000', color: '#000' }}
                />
              </div>
            </>
          )}

          {/* Balance Information - Show for deposit transactions */}
          {transactionType === 'deposit' && (
            <div className="space-y-3 pt-4 border-t-2 border-white/20">
              <h3 className="text-sm font-bold text-white">Balance Preview (After Update)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-bold text-white/80">Current Balance</Label>
                  <div className="h-12 flex items-center px-4 rounded-md bg-white/10 border-2 border-white/20 text-white font-mono">
                    {existingBalance.toFixed(8)} {assetSymbol}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-bold text-white/80">Balance After Update</Label>
                  <div className="h-12 flex items-center px-4 rounded-md bg-primary/20 border-2 border-primary/40 text-white font-mono font-bold">
                    {newBalance.toFixed(8)} {assetSymbol}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-bold text-white/80">USD Value (After)</Label>
                  <div className="h-12 flex items-center px-4 rounded-md bg-blue-500/20 border-2 border-blue-500/40 text-white font-mono font-bold">
                    ${updatedUsdValue.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status and Date - Conditional based on transaction type */}
          {transactionType !== 'withdrawal' && transactionType !== 'bank_transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs sm:text-sm font-bold text-white">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-12 text-sm border-2 border-amber-700 text-black bg-white" style={{ WebkitTextFillColor: '#000', color: '#000' }}>
                    <SelectValue placeholder="Select status" className="text-black" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[200] text-black">
                    <SelectItem value="pending" className="text-black focus:text-black data-[state=checked]:text-black">Pending</SelectItem>
                    <SelectItem value="completed" className="text-black focus:text-black data-[state=checked]:text-black">Completed</SelectItem>
                    <SelectItem value="failed" className="text-black focus:text-black data-[state=checked]:text-black">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transaction_date" className="text-xs sm:text-sm font-bold text-white">Date & Time</Label>
                <Input
                  id="transaction_date"
                  type="datetime-local"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black"
                  style={{ WebkitTextFillColor: '#000', color: '#000' }}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs sm:text-sm font-bold text-white">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-12 text-sm border-2 border-amber-700 text-black bg-white" style={{ WebkitTextFillColor: '#000', color: '#000' }}>
                    <SelectValue placeholder="Select status" className="text-black" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[200] text-black">
                    <SelectItem value="pending" className="text-black focus:text-black data-[state=checked]:text-black">Pending</SelectItem>
                    <SelectItem value="completed" className="text-black focus:text-black data-[state=checked]:text-black">Completed</SelectItem>
                    <SelectItem value="failed" className="text-black focus:text-black data-[state=checked]:text-black">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transaction_date" className="text-xs sm:text-sm font-bold text-white">Date & Time</Label>
                <Input
                  id="transaction_date"
                  type="datetime-local"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="h-12 text-sm border-2 border-amber-700 text-black bg-white caret-black"
                  style={{ WebkitTextFillColor: '#000', color: '#000' }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons - Different for withdrawal/bank_transfer */}
          {transactionType === 'withdrawal' || transactionType === 'bank_transfer' ? (
            <div className="space-y-3 pt-4 border-t-2 border-white/20">
              <h3 className="text-sm font-bold text-white">Balance Preview (After Update)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-bold text-white/80">Current Balance</Label>
                  <div className="h-12 flex items-center px-4 rounded-md bg-white/10 border-2 border-white/20 text-white font-mono">
                    {existingBalance.toFixed(8)} {transactionType === 'bank_transfer' ? bankTransferCrypto : assetSymbol}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-bold text-white/80">Balance After Update</Label>
                  <div className="h-12 flex items-center px-4 rounded-md bg-primary/20 border-2 border-primary/40 text-white font-mono font-bold">
                    {newBalance.toFixed(8)} {transactionType === 'bank_transfer' ? bankTransferCrypto : assetSymbol}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-bold text-white/80">USD Value (After)</Label>
                  <div className="h-12 flex items-center px-4 rounded-md bg-blue-500/20 border-2 border-blue-500/40 text-white font-mono font-bold">
                    ${updatedUsdValue.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Insufficient Balance Warning */}
              {newBalance < 0 && (
                <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-3 mb-4">
                  <p className="text-red-500 font-bold text-sm">
                    ⚠️ Insufficient Balance: User doesn't have enough {transactionType === 'bank_transfer' ? bankTransferCrypto : assetSymbol} for this transaction.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-xs text-white hover:text-white">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={(transactionType === 'bank_transfer' && !bankTransferCrypto) || newBalance < 0}
                  className={`flex-1 text-xs ${((transactionType === 'bank_transfer' && !bankTransferCrypto) || newBalance < 0) ? 'bg-gray-500/60 cursor-not-allowed opacity-70 hover:bg-gray-500/60' : 'bg-primary hover:bg-primary/90'}`}
                >
                  Update Transaction and Balance
                </Button>
                <Button type="button" onClick={handleDeny} className="flex-1 text-xs bg-red-600 hover:bg-red-700">
                  Deny
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-xs text-white hover:text-white">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 text-xs">
                Update Transaction and Balance
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};