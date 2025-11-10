import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, RefreshCw, Check, MessageCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDepositAddresses } from '@/hooks/useDepositAddresses';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { CryptoPriceFeed } from '@/components/CryptoPriceFeed';
import usdcLogo from '@/assets/usdc-logo.png';
import btcLogo from '@/assets/btc-logo.png';
import usdtTrc20Logo from '@/assets/usdt-trc20-logo.png';
import { useTranslation } from 'react-i18next';

const Deposit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addresses, loading, error, refetch } = useDepositAddresses();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const isMobile = useIsMobile();

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      toast({
        title: t('deposit.addressCopied'),
        description: t('deposit.addressCopiedDesc'),
        duration: 1000,
      });
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      toast({
        title: t('deposit.copyFailed'),
        description: t('deposit.copyFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleInitializeWallets = async () => {
    if (!user || !user.email) {
      toast({
        title: t('deposit.error'),
        description: t('deposit.userInfoNotAvailable'),
        variant: "destructive",
      });
      return;
    }

    // Prompt for password
    const password = prompt(t('deposit.enterPassword'));
    if (!password) {
      return;
    }

    setIsInitializing(true);
    
    try {
      console.log('🚀 Initializing wallets for user:', user.id);
      
      const { data, error } = await supabase.functions.invoke('initialize-user-wallets', {
        body: {
          userId: user.id,
          userEmail: user.email,
          userPassword: password
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Wallet initialization successful:', data);

      toast({
        title: t('deposit.initSuccess'),
        description: t('deposit.initSuccessDesc'),
        duration: 1000,
      });

      // Refresh addresses
      setTimeout(() => {
        refetch();
      }, 1000);

    } catch (error: any) {
      console.error('❌ Wallet initialization failed:', error);
      toast({
        title: t('deposit.initFailed'),
        description: error.message || t('deposit.initFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const getCryptoLogo = (symbol: string): string => {
    switch (symbol) {
      case 'ETH':
        return '/lovable-uploads/7fdca632-484d-4cd9-9f1a-c3e78b8b4e89.png';
      case 'USDT':
      case 'USDT-ERC20':
        return '/lovable-uploads/e8142317-83a5-4e7e-878f-bf01ac1a53fd.png';
      case 'USDT-TRC20':
      case 'USDT_TRON':
        return usdtTrc20Logo;
      case 'USDC':
      case 'USDC-ERC20':
        return usdcLogo;
      case 'BTC':
        return btcLogo;
      default:
        return '';
    }
  };

  const getNetworkDisplayName = (network: string | null): string => {
    switch (network) {
      case 'ethereum':
        return 'Ethereum Network';
      case 'erc20':
        return 'ERC-20';
      case 'bitcoin':
        return 'Bitcoin Network';
      case 'trc20':
        return 'TRC-20 (TRON)';
      default:
        return network || 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="container-responsive">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-responsive">
        <div className="max-w-4xl mx-auto">
          <Card className="p-responsive-md">
            <div className="text-center space-y-4">
              <p className="text-red-500">{t('deposit.error')}: {error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={refetch} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <RefreshCw className="w-4 h-4" />
                  {t('deposit.retry')}
                </Button>
                <Button onClick={handleInitializeWallets} disabled={isInitializing} variant="outline" className="gap-2">
                  {isInitializing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {t('deposit.initializing')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t('deposit.initializeWallets')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header - Responsive */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size={isMobile ? 'sm' : 'default'}
              onClick={() => navigate('/dashboard')}
              className="gap-2 text-white hover:text-white/80"
            >
              <ArrowLeft className="w-4 h-4" />
              {!isMobile && t('common.back')}
            </Button>
            <div>
              <h1 className="text-responsive-2xl font-bold text-white">{t('deposit.title')}</h1>
              <p className="text-white/80 text-responsive-sm">{t('deposit.sendCrypto')}</p>
            </div>
          </div>
        </div>

        {/* Asset Conversion Promotion Box */}
        <Card className="glass-card border-[hsl(var(--accent-blue))]/20 bg-gradient-to-r from-[hsl(var(--accent-blue))]/5 to-[hsl(var(--accent-purple))]/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[hsl(var(--accent-blue))] to-[hsl(var(--accent-purple))] rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm sm:text-base mb-1">{t('deposit.needDifferentAsset')}</h3>
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                    {t('deposit.needDifferentAssetDesc')}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/dashboard/chat')}
                className="bg-gradient-to-r from-[hsl(var(--accent-blue))] to-[hsl(var(--accent-purple))] hover:from-[hsl(var(--accent-blue))]/90 hover:to-[hsl(var(--accent-purple))]/90 text-white border-0 gap-2 flex-shrink-0"
                size={isMobile ? 'sm' : 'default'}
              >
                <MessageCircle className="w-4 h-4" />
                {t('deposit.talkToUs')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Crypto Price Feed */}
        <CryptoPriceFeed />

        {/* Deposit Addresses Grid - Responsive */}
        <div className="grid-responsive-2 gap-responsive-md">
          {addresses.map((address) => {
            const logoUrl = getCryptoLogo(address.asset_symbol);
            const networkDisplay = getNetworkDisplayName(address.network);
            const isCopied = copiedAddress === address.address;
            return (
              <Card key={address.id} className="p-responsive-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white flex-shrink-0">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`${address.asset_symbol} logo`}
                          className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) parent.innerHTML = `<span class="text-gray-800 text-xs sm:text-sm font-bold">${address.asset_symbol}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-gray-800 text-xs sm:text-sm font-bold">{address.asset_symbol}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-responsive-sm">{address.asset_symbol}</h3>
                      <p className="text-white/80 text-responsive-xs">{networkDisplay}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-white text-responsive-xs font-bold mb-2">{t('deposit.depositAddress')}</label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 bg-[#18191A] rounded-lg border border-white/20 min-w-0">
                        <p className="text-white text-responsive-xs font-mono break-all">{address.address}</p>
                      </div>
                      <Button
                        onClick={() => handleCopyAddress(address.address)}
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 h-auto px-3 py-3 bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                      >
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-primary/10 border-2 border-primary rounded-lg p-3">
                    <p className="text-white text-responsive-xs">
                      <strong className="text-primary text-sm">{t('deposit.importantWarning')}:</strong> {t('deposit.importantWarningDesc', { asset: address.asset_symbol })}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {addresses.length === 0 && (
          <Card className="p-responsive-md">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{t('deposit.noAddresses')}</h3>
                <p className="text-white/80 text-sm mb-4">
                  {t('deposit.noAddressesDesc')}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleInitializeWallets}
                  disabled={isInitializing}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isInitializing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('deposit.initializing')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t('deposit.initializeWallets')}
                    </>
                  )}
                </Button>
                <Button onClick={refetch} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {t('deposit.refresh')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Instructions Card - Responsive */}
        <Card className="p-responsive-sm">
          <CardHeader className="pb-3">
            <h3 className="text-responsive-lg font-bold text-white">{t('deposit.howToDeposit')}</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <p className="text-white text-xs sm:text-responsive-sm font-medium"><strong>{t('deposit.step1')}</strong> {t('deposit.step1Desc')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <p className="text-white text-xs sm:text-responsive-sm font-medium"><strong>{t('deposit.step2')}</strong> {t('deposit.step2Desc')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <p className="text-white text-xs sm:text-responsive-sm font-medium">{t('deposit.step3Desc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Deposit;
