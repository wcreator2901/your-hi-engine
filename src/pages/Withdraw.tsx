import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLivePrices } from '@/hooks/useLivePrices';
import { useWalletData } from '@/hooks/useWalletData';
import { supportedAssets } from '@/data/supportedAssets';
import { validateCryptoAddress, getNetworkFee } from '@/utils/cryptoAddressValidator';
import { TwoFactorVerification } from '@/components/TwoFactorVerification';
import { use2FA } from '@/hooks/use2FA';
import { useTranslation } from 'react-i18next';

const withdrawSchema = z.object({
  assetSymbol: z.string().min(1, 'Please select a cryptocurrency'),
  amount: z.coerce.number().min(0.00000001, 'Amount must be greater than 0'),
  withdrawalAddress: z.string().min(1, 'Withdrawal address is required'),
});

type WithdrawFormData = z.infer<typeof withdrawSchema>;

const Withdraw = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPriceForCrypto } = useLivePrices();
  const { prices } = useLivePrices();
  const { walletData, loading: walletsLoading } = useWalletData(prices);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressValidation, setAddressValidation] = useState({ isValid: false, error: '' });
  const [show2FAVerification, setShow2FAVerification] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<WithdrawFormData | null>(null);
  const { status: twoFAStatus } = use2FA();

  const form = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      assetSymbol: '',
      amount: 0,
      withdrawalAddress: '',
    },
  });

  // Watch form values with proper fallbacks and type checking
  const watchedAmountRaw = form.watch('amount');
  const watchedAmount = Number(watchedAmountRaw) || 0;
  const watchedAsset = form.watch('assetSymbol') || '';
  const watchedAddress = form.watch('withdrawalAddress') || '';

  // Get current wallet balance for selected asset with fallback
  const currentWallet = walletData?.find(wallet => wallet.symbol === watchedAsset);
  const walletBalance = currentWallet?.balance?.crypto || 0;
  
  // For ETH, we need to consider staking balance too
  // This is a placeholder - you'll need to integrate with your staking system
  const stakingBalance = watchedAsset === 'ETH' ? 0 : 0; // TODO: Get actual staking balance
  const totalAvailableBalance = walletBalance + stakingBalance;
  
  const networkFee = watchedAsset ? getNetworkFee(watchedAsset) : 0;

  // Validate address when it changes
  useEffect(() => {
    if (watchedAddress && watchedAsset) {
      const validation = validateCryptoAddress(watchedAddress, watchedAsset);
      setAddressValidation({
        isValid: validation.isValid,
        error: validation.error || ''
      });
    } else {
      setAddressValidation({ isValid: false, error: '' });
    }
  }, [watchedAddress, watchedAsset]);

  // Calculate USD amounts with proper error handling
  const calculateUsdAmount = () => {
    if (!watchedAmount || !watchedAsset || watchedAmount <= 0) return 0;
    
    try {
      const assetToCryptoId: { [key: string]: string } = {
        'ETH': 'ethereum',
        'USDT-ERC20': 'tether-erc20',
      };
      
      const cryptoId = assetToCryptoId[watchedAsset.toUpperCase()] || watchedAsset.toLowerCase();
      const price = getPriceForCrypto(cryptoId);
      
      return watchedAmount * price;
    } catch (error) {
      console.error('Error calculating USD amount:', error);
      return 0;
    }
  };

  const usdAmount = calculateUsdAmount();
  const totalToDebit = watchedAmount + networkFee;
  
  // Simplified and more explicit validation logic
  const hasValidAmount = watchedAmount > 0 && !isNaN(watchedAmount);
  const hasSufficientBalance = totalAvailableBalance > 0 && totalToDebit <= totalAvailableBalance;
  const hasValidAddress = addressValidation.isValid && watchedAddress.trim().length > 0;
  const hasSelectedAsset = watchedAsset.trim().length > 0;
  
  const canWithdraw = hasValidAmount && hasSufficientBalance && hasValidAddress && hasSelectedAsset;

  console.log('Withdraw validation:', {
    hasValidAmount,
    hasSufficientBalance,
    hasValidAddress,
    hasSelectedAsset,
    canWithdraw,
    watchedAmount,
    watchedAmountRaw,
    totalToDebit,
    walletBalance,
    stakingBalance,
    totalAvailableBalance,
    addressValidation,
    watchedAsset,
    watchedAddress: watchedAddress.trim()
  });

  // Validation errors
  const amountError = watchedAmount > totalAvailableBalance ? 
    `Insufficient balance. Available: ${totalAvailableBalance.toFixed(8)} ${watchedAsset} (Wallet: ${walletBalance.toFixed(8)}, Staking: ${stakingBalance.toFixed(8)})` : '';
  const balanceAfterFee = Math.max(0, totalAvailableBalance - networkFee);
  const maxWithdrawable = Math.max(0, balanceAfterFee);

  const handleWithdrawalSubmit = async (data: WithdrawFormData) => {
    // Check if 2FA is enabled
    if (twoFAStatus.isEnabled) {
      // Store the withdrawal data and show 2FA verification
      setPendingWithdrawal(data);
      setShow2FAVerification(true);
      return;
    }

    // If no 2FA, proceed directly
    await processWithdrawal(data);
  };

  const processWithdrawal = async (data: WithdrawFormData) => {
    if (!user) {
      toast({
        title: t('withdraw.error'),
        description: t('withdraw.mustBeLoggedIn'),
        variant: "destructive",
      });
      return;
    }

    // Validate balance before submitting
    if (data.amount > totalAvailableBalance) {
      toast({
        title: t('withdraw.error'),
        description: `${t('withdraw.insufficientBalance', { balance: totalAvailableBalance.toFixed(8), asset: data.assetSymbol, wallet: walletBalance.toFixed(8), staking: stakingBalance.toFixed(8) })}`,
        variant: "destructive",
      });
      return;
    }

    // Validate withdrawal address
    const addressCheck = validateCryptoAddress(data.withdrawalAddress, data.assetSymbol);
    if (!addressCheck.isValid) {
      toast({
        title: t('withdraw.error'),
        description: addressCheck.error || t('withdraw.invalidAddress'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: transactionError } = await supabase
        .from('user_transactions')
        .insert([{
          user_id: user.id,
          transaction_type: 'withdrawal',
          currency: data.assetSymbol,
          amount: data.amount,
          to_address: data.withdrawalAddress,
          status: 'pending',
        }]);

      if (transactionError) throw transactionError;

      toast({
        title: t('withdraw.success'),
        description: t('withdraw.withdrawalSuccess'),
        duration: 1000,
      });

      form.reset();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast({
        title: t('withdraw.error'),
        description: t('withdraw.withdrawalError'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASuccess = async () => {
    if (pendingWithdrawal) {
      await processWithdrawal(pendingWithdrawal);
      setPendingWithdrawal(null);
    }
  };

  if (walletsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[hsl(var(--accent-blue))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary text-responsive-sm">{t('withdraw.loadingWallet')}</p>
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
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 fade-in">
            <Link to="/dashboard" className="inline-flex items-center text-primary hover:text-primary/80 mb-4 text-sm sm:text-base transition-colors font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('withdraw.backToDashboard')}
            </Link>
            <h1 className="text-responsive-2xl font-bold text-white mb-2">{t('withdraw.withdrawFunds')}</h1>
            <p className="text-responsive-sm text-white/90">{t('withdraw.transferFunds')}</p>
          </div>

          {/* Withdraw Form */}
          <div className="balance-card fade-in" style={{animationDelay: '0.1s'}}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[hsl(var(--accent-purple))]/20 to-[hsl(var(--accent-blue))]/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-[hsl(var(--accent-purple))]/30">
              <Send className="w-6 h-6 sm:w-8 sm:h-8 text-accent-purple transform rotate-180" />
            </div>
            
            <h2 className="text-responsive-lg font-bold text-white mb-4 sm:mb-6 text-center">{t('withdraw.withdrawCryptocurrency')}</h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleWithdrawalSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="assetSymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-responsive-sm text-white font-bold">{t('withdraw.cryptocurrency')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#18191A] text-white border-white/20">
                            <SelectValue placeholder={t('withdraw.selectCryptocurrency')} className="text-white placeholder:text-[#CCCCCC]" />
                          </SelectTrigger>
                        </FormControl>
                         <SelectContent className="bg-[#18191A] border border-white/20 shadow-2xl z-50">
                           {supportedAssets.map((crypto) => (
                             <SelectItem key={`${crypto.symbol}-${crypto.network || 'main'}`} value={crypto.symbol} className="text-white hover:bg-white/10 focus:bg-white/10">
                               <div className="flex items-center">
                                 <span className="mr-2">{crypto.logo}</span>
                                 <span className="text-sm sm:text-base text-white">{crypto.symbol}</span>
                                 {crypto.network && (
                                   <span className="ml-2 text-xs text-white/70">({crypto.network})</span>
                                 )}
                               </div>
                             </SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-responsive-sm text-white font-bold">
                        {t('withdraw.amount')} {watchedAsset && `(${t('withdraw.available')}: ${totalAvailableBalance.toFixed(8)} ${watchedAsset})`}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.00000001"
                          placeholder="0.00000000"
                          max={maxWithdrawable}
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            // Limit input to available balance
                            if (value <= maxWithdrawable) {
                              field.onChange(e);
                            } else {
                              field.onChange(maxWithdrawable.toString());
                            }
                          }}
                          className="bg-[#18191A] text-white placeholder:text-[#CCCCCC] border-white/20"
                        />
                      </FormControl>
                      {watchedAsset && maxWithdrawable > 0 && (
                        <div className="flex justify-between items-center mt-1 text-xs text-white">
                          <span>{t('withdraw.maxWithdrawable')}: {maxWithdrawable.toFixed(8)} {watchedAsset}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => form.setValue('amount', maxWithdrawable)}
                            className="h-6 px-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                          >
                            {t('withdraw.max')}
                          </Button>
                        </div>
                      )}
                      <FormMessage />
                      {amountError && (
                        <p className="text-sm text-primary font-bold mt-1">{amountError}</p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="withdrawalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-responsive-sm text-white font-bold">{t('withdraw.destinationAddress')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('withdraw.enterDestination')}
                          {...field}
                          className="bg-[#18191A] text-white placeholder:text-[#CCCCCC] border-white/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-primary/10 border-2 border-primary rounded-2xl p-4">
                  <h3 className="font-bold text-primary mb-2 text-sm">{t('withdraw.securityNotice')}</h3>
                  <ul className="text-xs text-white space-y-1">
                    <li className="font-medium">• {t('withdraw.securityItem1')}</li>
                    <li className="font-medium">• {t('withdraw.securityItem2')}</li>
                    <li className="font-medium">• {t('withdraw.securityItem3')}</li>
                    <li className="font-medium">• {t('withdraw.securityItem4')}</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base border-0"
                  disabled={isSubmitting || !canWithdraw}
                >
                  {isSubmitting ? t('withdraw.processing') : t('withdraw.submitWithdrawal')}
                </Button>

                {/* Show validation errors */}
                {!canWithdraw && (
                  <div className="mt-2 space-y-1">
                    {!hasValidAmount && (
                      <p className="text-sm text-primary font-bold">{t('withdraw.enterValidAmount')}</p>
                    )}
                    {!hasSufficientBalance && amountError && (
                      <p className="text-sm text-primary font-bold">{amountError}</p>
                    )}
                    {!hasValidAddress && addressValidation.error && (
                      <p className="text-sm text-primary font-bold">{addressValidation.error}</p>
                    )}
                    {!hasSelectedAsset && (
                      <p className="text-sm text-primary font-bold">{t('withdraw.selectAssetFirst')}</p>
                    )}
                  </div>
                )}
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* 2FA Verification Modal */}
      <TwoFactorVerification
        isOpen={show2FAVerification}
        onClose={() => {
          setShow2FAVerification(false);
          setPendingWithdrawal(null);
        }}
        onSuccess={handle2FASuccess}
        title={t('withdraw.secureWithdrawal')}
        description={t('withdraw.enter2FACode')}
        actionText={t('withdraw.authorizeWithdrawal')}
      />
    </div>
  );
};

export default Withdraw;
