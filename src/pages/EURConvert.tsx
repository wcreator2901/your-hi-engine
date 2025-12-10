import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowDownUp, RefreshCw, DollarSign, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useLivePrices } from '@/hooks/useLivePrices';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { SUPPORTED_CRYPTOS, UserWallet, BankDepositDetails, isStablecoin } from '@/types/bankDeposit';

const EURConvert = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { prices, isLoading: pricesLoading } = useLivePrices();
  const { exchangeRate } = useExchangeRate();

  const [depositDetails, setDepositDetails] = useState<BankDepositDetails | null>(null);
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  // Conversion state
  const [direction, setDirection] = useState<'eur_to_crypto' | 'crypto_to_eur'>('eur_to_crypto');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTC');
  const [eurAmount, setEurAmount] = useState<string>('');
  const [cryptoAmount, setCryptoAmount] = useState<string>('');

  // Memoized fetch functions with useCallback
  const fetchDepositDetails = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('user_bank_deposit_details')
        .select('id, user_id, amount_eur')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching deposit details:', error);
      }

      setDepositDetails((data as BankDepositDetails) || null);
    } catch (error) {
      console.error('Error fetching deposit details:', error);
    }
  }, [user]);

  const fetchUserWallets = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('id, user_id, asset_symbol, balance_crypto')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setUserWallets(data || []);
    } catch (error) {
      console.error('Error fetching user wallets:', error);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDepositDetails(), fetchUserWallets()]);
    setLoading(false);
  }, [fetchDepositDetails, fetchUserWallets]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const depositChannel = supabase
      .channel('eur-convert-deposit-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_bank_deposit_details',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchDepositDetails()
      )
      .subscribe();

    const walletChannel = supabase
      .channel('eur-convert-wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchUserWallets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(depositChannel);
      supabase.removeChannel(walletChannel);
    };
  }, [user, fetchDepositDetails, fetchUserWallets]);

  // Memoized crypto price getter
  const getCryptoPrice = useCallback((symbol: string): number => {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.symbol === symbol);
    if (!crypto || !prices) return 0;

    // Stablecoins always $1
    if (isStablecoin(symbol)) {
      return 1;
    }

    return prices[crypto.cryptoId] || 0;
  }, [prices]);

  // Memoized wallet balance getter
  const getWalletBalance = useCallback((symbol: string): number => {
    const wallet = userWallets.find(w => w.asset_symbol === symbol);
    return wallet?.balance_crypto || 0;
  }, [userWallets]);

  // Memoized conversion calculation
  const calculateConversion = useCallback(() => {
    const cryptoPrice = getCryptoPrice(selectedCrypto);
    if (cryptoPrice === 0) return;

    if (direction === 'eur_to_crypto') {
      // EUR -> Crypto
      if (eurAmount) {
        const eurValue = parseFloat(eurAmount);
        if (!isNaN(eurValue)) {
          // EUR to USD, then USD to Crypto
          const usdValue = eurValue / exchangeRate;
          const crypto = usdValue / cryptoPrice;
          setCryptoAmount(crypto.toFixed(8));
        }
      } else {
        setCryptoAmount('');
      }
    } else {
      // Crypto -> EUR
      if (cryptoAmount) {
        const cryptoValue = parseFloat(cryptoAmount);
        if (!isNaN(cryptoValue)) {
          // Crypto to USD, then USD to EUR
          const usdValue = cryptoValue * cryptoPrice;
          const eur = usdValue * exchangeRate;
          setEurAmount(eur.toFixed(2));
        }
      } else {
        setEurAmount('');
      }
    }
  }, [getCryptoPrice, selectedCrypto, direction, eurAmount, cryptoAmount, exchangeRate]);

  // Recalculate when inputs change
  useEffect(() => {
    calculateConversion();
  }, [calculateConversion]);

  // Memoized event handlers
  const handleEurChange = useCallback((value: string) => {
    setEurAmount(value);
    if (direction === 'crypto_to_eur') {
      setDirection('eur_to_crypto');
    }
  }, [direction]);

  const handleCryptoChange = useCallback((value: string) => {
    setCryptoAmount(value);
    if (direction === 'eur_to_crypto') {
      setDirection('crypto_to_eur');
    }
  }, [direction]);

  const toggleDirection = useCallback(() => {
    setDirection(prev => prev === 'eur_to_crypto' ? 'crypto_to_eur' : 'eur_to_crypto');
    setEurAmount('');
    setCryptoAmount('');
  }, []);

  // Max button handlers
  const handleMaxEur = useCallback(() => {
    const maxEur = depositDetails?.amount_eur || 0;
    if (maxEur > 0) {
      setDirection('eur_to_crypto');
      setEurAmount(maxEur.toFixed(2));
    }
  }, [depositDetails]);

  const handleMaxCrypto = useCallback(() => {
    const maxCrypto = getWalletBalance(selectedCrypto);
    if (maxCrypto > 0) {
      setDirection('crypto_to_eur');
      setCryptoAmount(maxCrypto.toFixed(8));
    }
  }, [getWalletBalance, selectedCrypto]);

  // Memoized computed values
  const eurBalance = useMemo(() => depositDetails?.amount_eur || 0, [depositDetails]);
  const cryptoBalance = useMemo(() => getWalletBalance(selectedCrypto), [getWalletBalance, selectedCrypto]);
  const cryptoPrice = useMemo(() => getCryptoPrice(selectedCrypto), [getCryptoPrice, selectedCrypto]);

  const handleConvert = useCallback(async () => {
    if (!user) return;

    const eurValue = parseFloat(eurAmount);
    const cryptoValue = parseFloat(cryptoAmount);

    if (isNaN(eurValue) || isNaN(cryptoValue) || eurValue <= 0 || cryptoValue <= 0) {
      toast({
        title: t('common.error', 'Error'),
        description: t('eurConvert.invalidAmount', 'Please enter valid amounts'),
        variant: "destructive",
      });
      return;
    }

    // Validate sufficient balance
    if (direction === 'eur_to_crypto') {
      const eurBalance = depositDetails?.amount_eur || 0;
      if (eurValue > eurBalance) {
        toast({
          title: t('common.error', 'Error'),
          description: t('eurConvert.insufficientEur', 'Insufficient EUR balance'),
          variant: "destructive",
        });
        return;
      }
      // CRITICAL: Verify wallet exists before conversion
      const wallet = userWallets.find(w => w.asset_symbol === selectedCrypto);
      if (!wallet) {
        toast({
          title: t('common.error', 'Error'),
          description: t('eurConvert.noWalletFound', `No ${selectedCrypto} wallet found. Please contact support.`),
          variant: "destructive",
        });
        return;
      }
    } else {
      const cryptoBalance = getWalletBalance(selectedCrypto);
      if (cryptoValue > cryptoBalance) {
        toast({
          title: t('common.error', 'Error'),
          description: t('eurConvert.insufficientCrypto', 'Insufficient crypto balance'),
          variant: "destructive",
        });
        return;
      }
      // CRITICAL: Verify wallet exists before conversion
      const wallet = userWallets.find(w => w.asset_symbol === selectedCrypto);
      if (!wallet) {
        toast({
          title: t('common.error', 'Error'),
          description: t('eurConvert.noWalletFound', `No ${selectedCrypto} wallet found. Please contact support.`),
          variant: "destructive",
        });
        return;
      }
    }

    setConverting(true);

    // Store original values for potential rollback
    const originalEurBalance = depositDetails?.amount_eur || 0;
    const wallet = userWallets.find(w => w.asset_symbol === selectedCrypto);
    const originalCryptoBalance = wallet?.balance_crypto || 0;

    try {
      if (direction === 'eur_to_crypto') {
        // Step 1: Deduct EUR first
        const newEurBalance = originalEurBalance - eurValue;

        if (depositDetails?.id) {
          const { error: eurError } = await (supabase as any)
            .from('user_bank_deposit_details')
            .update({ amount_eur: newEurBalance, updated_at: new Date().toISOString() })
            .eq('id', depositDetails.id);

          if (eurError) throw eurError;
        }

        // Step 2: Add crypto (wallet existence already verified above)
        try {
          const newCryptoBalance = originalCryptoBalance + cryptoValue;
          const { error: cryptoError } = await supabase
            .from('user_wallets')
            .update({ balance_crypto: newCryptoBalance, updated_at: new Date().toISOString() })
            .eq('id', wallet!.id);

          if (cryptoError) {
            // ROLLBACK: Restore EUR balance if crypto update fails
            console.error('Crypto update failed, rolling back EUR deduction');
            await (supabase as any)
              .from('user_bank_deposit_details')
              .update({ amount_eur: originalEurBalance, updated_at: new Date().toISOString() })
              .eq('id', depositDetails!.id);
            throw cryptoError;
          }
        } catch (cryptoUpdateError) {
          throw cryptoUpdateError;
        }
      } else {
        // Step 1: Deduct crypto first (wallet existence already verified above)
        const newCryptoBalance = originalCryptoBalance - cryptoValue;
        const { error: cryptoError } = await supabase
          .from('user_wallets')
          .update({ balance_crypto: newCryptoBalance, updated_at: new Date().toISOString() })
          .eq('id', wallet!.id);

        if (cryptoError) throw cryptoError;

        // Step 2: Add EUR
        try {
          const newEurBalance = originalEurBalance + eurValue;

          if (depositDetails?.id) {
            const { error: eurError } = await (supabase as any)
              .from('user_bank_deposit_details')
              .update({ amount_eur: newEurBalance, updated_at: new Date().toISOString() })
              .eq('id', depositDetails.id);

            if (eurError) {
              // ROLLBACK: Restore crypto balance if EUR update fails
              console.error('EUR update failed, rolling back crypto deduction');
              await supabase
                .from('user_wallets')
                .update({ balance_crypto: originalCryptoBalance, updated_at: new Date().toISOString() })
                .eq('id', wallet!.id);
              throw eurError;
            }
          } else {
            // Create new EUR record
            const { error: eurError } = await (supabase as any)
              .from('user_bank_deposit_details')
              .insert([{ user_id: user.id, amount_eur: newEurBalance }]);

            if (eurError) {
              // ROLLBACK: Restore crypto balance if EUR insert fails
              console.error('EUR insert failed, rolling back crypto deduction');
              await supabase
                .from('user_wallets')
                .update({ balance_crypto: originalCryptoBalance, updated_at: new Date().toISOString() })
                .eq('id', wallet!.id);
              throw eurError;
            }
          }
        } catch (eurUpdateError) {
          throw eurUpdateError;
        }
      }

      // Create transaction record
      const { error: txError } = await supabase
        .from('user_transactions')
        .insert([{
          user_id: user.id,
          transaction_type: 'conversion',
          currency: direction === 'eur_to_crypto' ? 'EUR' : selectedCrypto,
          amount: direction === 'eur_to_crypto' ? eurValue : cryptoValue,
          amount_crypto: cryptoValue,
          amount_fiat: eurValue,
          asset_symbol: selectedCrypto,
          status: 'completed',
        }]);

      if (txError) {
        console.error('Error creating transaction record:', txError);
      }

      toast({
        title: t('common.success', 'Success'),
        description: direction === 'eur_to_crypto'
          ? t('eurConvert.convertedEurToCrypto', `Converted €${eurValue.toFixed(2)} to ${cryptoValue.toFixed(8)} ${selectedCrypto}`)
          : t('eurConvert.convertedCryptoToEur', `Converted ${cryptoValue.toFixed(8)} ${selectedCrypto} to €${eurValue.toFixed(2)}`),
        duration: 3000,
      });

      // Reset form and refresh data
      setEurAmount('');
      setCryptoAmount('');
      await fetchData();

    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('eurConvert.conversionFailed', 'Conversion failed. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setConverting(false);
    }
  }, [user, eurAmount, cryptoAmount, direction, depositDetails, userWallets, selectedCrypto, getWalletBalance, fetchData, t]);

  if (loading || pricesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">{t('common.loading', 'Loading...')}</p>
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

      <div className="container-responsive space-y-6 sm:space-y-8 py-6 sm:py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 fade-in">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-primary hover:text-primary/80 mb-4 text-sm sm:text-base transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.backToDashboard', 'Back to Dashboard')}
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white drop-shadow-lg">
              {t('eurConvert.title', 'EUR Convert')}
            </h1>
            <p className="text-white/80 text-lg">
              {t('eurConvert.subtitle', 'Convert between EUR and cryptocurrency')}
            </p>
          </div>

          {/* Balances Overview */}
          <div className="grid grid-cols-2 gap-4 mb-6 fade-in" style={{animationDelay: '0.1s'}}>
            <div className="balance-card">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="text-white/70 text-sm">{t('eurConvert.eurBalance', 'EUR Balance')}</span>
              </div>
              <p className="text-2xl font-bold text-green-400">€{eurBalance.toFixed(2)}</p>
            </div>
            <div className="balance-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <span className="text-white/70 text-sm">{selectedCrypto} {t('eurConvert.balance', 'Balance')}</span>
              </div>
              <p className="text-2xl font-bold text-orange-400">{cryptoBalance.toFixed(8)}</p>
            </div>
          </div>

          {/* Conversion Card */}
          <div className="balance-card fade-in" style={{animationDelay: '0.2s'}}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-primary/30">
              <ArrowDownUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
              {direction === 'eur_to_crypto'
                ? t('eurConvert.eurToCrypto', 'EUR to Crypto')
                : t('eurConvert.cryptoToEur', 'Crypto to EUR')}
            </h2>

            {/* Crypto Selection */}
            <div className="mb-6">
              <Label className="text-white font-bold mb-2 block">
                {t('eurConvert.selectCrypto', 'Select Cryptocurrency')}
              </Label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger className="bg-black text-white border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  {SUPPORTED_CRYPTOS.map(crypto => (
                    <SelectItem
                      key={crypto.symbol}
                      value={crypto.symbol}
                      className="text-white hover:bg-slate-700"
                    >
                      {crypto.symbol} - {crypto.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-white/60 text-sm mt-1">
                {t('eurConvert.currentPrice', 'Current Price')}: ${cryptoPrice.toLocaleString()}
              </p>
            </div>

            {/* EUR Input */}
            <div className="mb-4">
              <Label className="text-white font-bold mb-2 block">
                {t('eurConvert.eurAmount', 'EUR Amount')}
              </Label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 font-bold">€</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={eurAmount}
                    onChange={(e) => handleEurChange(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 bg-black text-white border-white/20 text-lg"
                    disabled={direction === 'crypto_to_eur'}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMaxEur}
                  disabled={eurBalance <= 0}
                  className="border-primary/50 text-primary hover:bg-primary/10 px-3 font-semibold"
                >
                  {t('common.max', 'Max')}
                </Button>
              </div>
              <p className="text-white/60 text-sm mt-1">
                {t('eurConvert.available', 'Available')}: €{eurBalance.toFixed(2)}
              </p>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center my-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDirection}
                className="rounded-full border-white/20 text-white hover:bg-white/10"
              >
                <ArrowDownUp className="w-5 h-5" />
              </Button>
            </div>

            {/* Crypto Input */}
            <div className="mb-6">
              <Label className="text-white font-bold mb-2 block">
                {selectedCrypto} {t('eurConvert.amount', 'Amount')}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.00000001"
                  value={cryptoAmount}
                  onChange={(e) => handleCryptoChange(e.target.value)}
                  placeholder="0.00000000"
                  className="flex-1 bg-black text-white border-white/20 text-lg"
                  disabled={direction === 'eur_to_crypto'}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMaxCrypto}
                  disabled={cryptoBalance <= 0}
                  className="border-primary/50 text-primary hover:bg-primary/10 px-3 font-semibold"
                >
                  {t('common.max', 'Max')}
                </Button>
              </div>
              <p className="text-white/60 text-sm mt-1">
                {t('eurConvert.available', 'Available')}: {cryptoBalance.toFixed(8)} {selectedCrypto}
              </p>
            </div>

            {/* Exchange Rate Info */}
            <div className="bg-black/30 rounded-lg p-4 mb-6 border border-white/10">
              <p className="text-white/70 text-sm">
                {t('eurConvert.exchangeRate', 'Exchange Rate')}: 1 USD = €{exchangeRate.toFixed(4)}
              </p>
              <p className="text-white/70 text-sm">
                1 {selectedCrypto} = €{(cryptoPrice * exchangeRate).toFixed(2)}
              </p>
            </div>

            {/* Convert Button */}
            <Button
              onClick={handleConvert}
              disabled={converting || !eurAmount || !cryptoAmount}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3"
            >
              {converting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('eurConvert.converting', 'Converting...')}
                </>
              ) : (
                <>
                  <ArrowDownUp className="w-4 h-4 mr-2" />
                  {t('eurConvert.convert', 'Convert')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EURConvert;
