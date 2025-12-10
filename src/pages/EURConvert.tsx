import React, { useState, useEffect } from 'react';
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

interface BankDepositDetails {
  id: string;
  user_id: string;
  amount_eur: number;
}

interface UserWallet {
  id: string;
  asset_symbol: string;
  balance_crypto: number;
}

const supportedCryptos = [
  { symbol: 'BTC', name: 'Bitcoin', cryptoId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', cryptoId: 'ethereum' },
  { symbol: 'USDT-ERC20', name: 'Tether (ERC20)', cryptoId: 'tether' },
  { symbol: 'USDC-ERC20', name: 'USD Coin (ERC20)', cryptoId: 'usd-coin' },
  { symbol: 'USDT_TRON', name: 'Tether (TRC20)', cryptoId: 'tether' },
];

const EURConvert = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { prices, loading: pricesLoading } = useLivePrices();

  const [depositDetails, setDepositDetails] = useState<BankDepositDetails | null>(null);
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  // Conversion state
  const [direction, setDirection] = useState<'eur_to_crypto' | 'crypto_to_eur'>('eur_to_crypto');
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTC');
  const [eurAmount, setEurAmount] = useState<string>('');
  const [cryptoAmount, setCryptoAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(0.93); // Default EUR/USD rate

  useEffect(() => {
    if (user) {
      fetchData();
      fetchExchangeRate();
    }
  }, [user]);

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
  }, [user]);

  // Recalculate when inputs change
  useEffect(() => {
    calculateConversion();
  }, [eurAmount, cryptoAmount, selectedCrypto, direction, prices, exchangeRate]);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      if (data.rates && data.rates.EUR) {
        setExchangeRate(data.rates.EUR);
        console.log('EUR/USD Exchange Rate Updated:', data.rates.EUR);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchDepositDetails(), fetchUserWallets()]);
    setLoading(false);
  };

  const fetchDepositDetails = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_bank_deposit_details')
        .select('id, user_id, amount_eur')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching deposit details:', error);
      }

      setDepositDetails(data || null);
    } catch (error) {
      console.error('Error fetching deposit details:', error);
    }
  };

  const fetchUserWallets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('id, asset_symbol, balance_crypto')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setUserWallets(data || []);
    } catch (error) {
      console.error('Error fetching user wallets:', error);
    }
  };

  const getCryptoPrice = (symbol: string): number => {
    const crypto = supportedCryptos.find(c => c.symbol === symbol);
    if (!crypto || !prices) return 0;

    // Stablecoins
    if (symbol.includes('USDT') || symbol.includes('USDC')) {
      return 1;
    }

    return prices[crypto.cryptoId] || 0;
  };

  const getWalletBalance = (symbol: string): number => {
    const wallet = userWallets.find(w => w.asset_symbol === symbol);
    return wallet?.balance_crypto || 0;
  };

  const calculateConversion = () => {
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
  };

  const handleEurChange = (value: string) => {
    setEurAmount(value);
    if (direction === 'crypto_to_eur') {
      setDirection('eur_to_crypto');
    }
  };

  const handleCryptoChange = (value: string) => {
    setCryptoAmount(value);
    if (direction === 'eur_to_crypto') {
      setDirection('crypto_to_eur');
    }
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'eur_to_crypto' ? 'crypto_to_eur' : 'eur_to_crypto');
    setEurAmount('');
    setCryptoAmount('');
  };

  const handleConvert = async () => {
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
    }

    setConverting(true);

    try {
      if (direction === 'eur_to_crypto') {
        // Deduct EUR
        const newEurBalance = (depositDetails?.amount_eur || 0) - eurValue;

        if (depositDetails?.id) {
          const { error: eurError } = await supabase
            .from('user_bank_deposit_details')
            .update({ amount_eur: newEurBalance, updated_at: new Date().toISOString() })
            .eq('id', depositDetails.id);

          if (eurError) throw eurError;
        }

        // Add crypto
        const wallet = userWallets.find(w => w.asset_symbol === selectedCrypto);
        if (wallet) {
          const newCryptoBalance = (wallet.balance_crypto || 0) + cryptoValue;
          const { error: cryptoError } = await supabase
            .from('user_wallets')
            .update({ balance_crypto: newCryptoBalance, updated_at: new Date().toISOString() })
            .eq('id', wallet.id);

          if (cryptoError) throw cryptoError;
        }
      } else {
        // Deduct crypto
        const wallet = userWallets.find(w => w.asset_symbol === selectedCrypto);
        if (wallet) {
          const newCryptoBalance = (wallet.balance_crypto || 0) - cryptoValue;
          const { error: cryptoError } = await supabase
            .from('user_wallets')
            .update({ balance_crypto: newCryptoBalance, updated_at: new Date().toISOString() })
            .eq('id', wallet.id);

          if (cryptoError) throw cryptoError;
        }

        // Add EUR
        const newEurBalance = (depositDetails?.amount_eur || 0) + eurValue;

        if (depositDetails?.id) {
          const { error: eurError } = await supabase
            .from('user_bank_deposit_details')
            .update({ amount_eur: newEurBalance, updated_at: new Date().toISOString() })
            .eq('id', depositDetails.id);

          if (eurError) throw eurError;
        } else {
          // Create new record
          const { error: eurError } = await supabase
            .from('user_bank_deposit_details')
            .insert([{ user_id: user.id, amount_eur: newEurBalance }]);

          if (eurError) throw eurError;
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
  };

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

  const eurBalance = depositDetails?.amount_eur || 0;
  const cryptoBalance = getWalletBalance(selectedCrypto);
  const cryptoPrice = getCryptoPrice(selectedCrypto);

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
                  {supportedCryptos.map(crypto => (
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
              <div className="relative">
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
              <Input
                type="number"
                step="0.00000001"
                value={cryptoAmount}
                onChange={(e) => handleCryptoChange(e.target.value)}
                placeholder="0.00000000"
                className="bg-black text-white border-white/20 text-lg"
                disabled={direction === 'eur_to_crypto'}
              />
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
