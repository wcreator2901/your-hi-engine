import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Copy, CheckCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSingleWalletData } from '@/hooks/useSingleWalletData';
import { useLivePrices } from '@/hooks/useLivePrices';
import { useState } from 'react';
import { useDepositAddresses } from '@/hooks/useDepositAddresses';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import usdtTrc20Logo from '@/assets/usdt-trc20-logo.png';
import btcLogo from '@/assets/btc-logo.png';
import ethereumGif from '@/assets/ethereum.gif';
import usdcLogo from '@/assets/usdc-logo.png';

// Map asset symbols to names
const assetNames: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'USDT': 'Tether',
  'USDT_TRON': 'USDT (TRC20)',
  'USDT-TRC20': 'USDT (TRC20)',
  'USDT-ERC20': 'USDT (ERC20)',
  'USDC': 'USDC',
  'USDC-ERC20': 'USDC (ERC20)',
  'BNB': 'Binance Coin',
  'SOL': 'Solana',
  'XRP': 'XRP',
  'ADA': 'Cardano',
  'DOGE': 'Dogecoin',
  'AVAX': 'Avalanche'
};

// Map asset symbols to price API identifiers
const symbolToPriceId: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether-erc20',
  'USDT-ERC20': 'tether-erc20',
  'USDT_TRON': 'tether-erc20',
  'USDT-TRC20': 'tether-erc20',
  'USDC': 'usd-coin',
  'USDC-ERC20': 'usd-coin',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'AVAX': 'avalanche-2'
};

const AssetDetail = () => {
  const { t } = useTranslation();
  const { symbol } = useParams<{ symbol: string }>();
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  if (!symbol) {
    return <div>{t('assetDetail.notFound')}</div>;
  }

  const { walletData, loading, error, refetch } = useSingleWalletData(symbol);
  const { getPriceForCrypto, refreshPrices, isLoading: pricesLoading } = useLivePrices();
  
  const assetName = assetNames[symbol] || symbol;
  const priceId = symbolToPriceId[symbol];
  const displaySymbol = symbol.replace('_TRON', '').replace('-TRC20', '').replace('-ERC20', '');

  const { addresses, loading: addressesLoading, refetch: refetchAddresses } = useDepositAddresses();
  const upperSymbol = symbol.toUpperCase();
  const symbolAliases = (upperSymbol === 'USDT-TRC20' || upperSymbol === 'USDT_TRON') ? ['USDT_TRON', 'USDT-TRC20'] : [upperSymbol];
  const depositEntry = addresses.find(a => symbolAliases.includes((a.asset_symbol || '').toUpperCase()));
const selectedAddress = depositEntry?.address || walletData?.wallet_address || '';

  const copyAddress = () => {
    if (selectedAddress) {
      navigator.clipboard.writeText(selectedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentPrice = priceId ? getPriceForCrypto(priceId) : 0;

  const handleRefresh = () => {
    refetch();
    refetchAddresses();
    refreshPrices();
  };

  // Format price with proper decimal places
  const formattedPrice = currentPrice && currentPrice > 0 ? currentPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) : '0.00';

  // Calculate 24h change (mock data for now)
  const change24h = 1.73; // This would come from your price API

  return (
    <div className="min-h-screen bg-[#18191A] relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container-responsive py-6 sm:py-8 relative z-10">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header - Centered */}
          <div className="space-y-4 mb-8 fade-in text-center flex flex-col items-center">
            {/* Title Row with Logo */}
            <div className="flex items-center justify-center space-x-3">
              {(symbol === 'USDT_TRON' || symbol === 'USDT-TRC20') ? (
                <img src={usdtTrc20Logo} alt="USDT TRC20" className="w-10 h-10 rounded-xl" />
              ) : symbol === 'USDT-ERC20' ? (
                <img src="/lovable-uploads/e8142317-83a5-4e7e-878f-bf01ac1a53fd.png" alt="USDT ERC20" className="w-10 h-10 rounded-xl" />
              ) : (symbol === 'USDC' || symbol === 'USDC-ERC20') ? (
                <img src={usdcLogo} alt="USDC" className="w-10 h-10 rounded-xl" />
              ) : symbol === 'BTC' ? (
                <img src={btcLogo} alt="Bitcoin" className="w-10 h-10 rounded-xl" />
              ) : symbol === 'ETH' ? (
                <img src={ethereumGif} alt="Ethereum" className="w-10 h-10 rounded-xl" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{symbol.split('_')[0]}</span>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{assetName}</h1>
            </div>
            
            {/* Buttons Row */}
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="bg-white/5 text-white border-white/10 hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('assetDetail.dashboard')}
                </Button>
              </Link>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="bg-white/5 text-white border-white/10 hover:bg-white/10"
                disabled={loading || pricesLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${(loading || pricesLoading) ? 'animate-spin' : ''}`} />
                {t('assetDetail.refresh')}
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-6 fade-in">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Current Price Card */}
            <Card className="bg-[hsl(var(--muted))] border-white/10 fade-in" style={{animationDelay: '0.1s'}}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-white/70">{t('assetDetail.currentPrice')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-responsive-xl font-bold text-white">${formattedPrice}</p>
                  <div className="flex items-center space-x-1">
                    <span className="text-[hsl(var(--success-green))] text-sm">↗ +{change24h}%</span>
                    <span className="text-white/60 text-sm">{t('assetDetail.change24h')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Balance Card */}
            <Card className="bg-[hsl(var(--muted))] border-white/10 fade-in" style={{animationDelay: '0.2s'}}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-white/70">Your Balance</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-white/10 rounded mb-2"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                  </div>
                ) : walletData ? (
                  <div className="space-y-1">
                    <p className="text-responsive-xl font-bold text-white">
                      {(walletData.balance_crypto || 0).toFixed(2)} {displaySymbol}
                    </p>
                    <p className="text-white/60 text-sm">
                      ≈ ${(walletData.balance_fiat || 0).toFixed(2)} USD
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-responsive-xl font-bold text-white">0.00 {displaySymbol}</p>
                    <p className="text-white/60 text-sm">≈ $0.00 USD</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Receive Section */}
            <Card className="bg-[hsl(var(--muted))] border-white/10 fade-in" style={{animationDelay: '0.3s'}}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-primary">↓</span>
                  <span className="text-white">Receive {symbol}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-white/70">
                  Use this address to receive {assetName} deposits
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Deposit Address
                  </label>
                  {(loading || addressesLoading) ? (
                    <div className="animate-pulse">
                      <div className="h-12 bg-white/10 rounded"></div>
                    </div>
                  ) : selectedAddress ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-[#18191A] rounded-lg border border-white/10">
                        <p className="text-xs text-white font-mono break-all">
                          {selectedAddress}
                        </p>
                      </div>
                      
                       <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-white/10 text-white border-white/20 hover:bg-white/20 flex-1"
                          onClick={copyAddress}
                        >
                          {copied ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <Copy className="w-4 h-4 mr-1" />
                          )}
                          {copied ? 'Copied!' : 'Copy Address'}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                          onClick={() => setQrOpen(true)}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Alert className="bg-white/5 border-white/10">
                      <AlertDescription className="text-white/70">
                        No deposit address available. Please try refreshing or contact support.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Alert className="bg-primary/10 border-primary/20">
                  <AlertDescription className="text-white text-xs">
                    <div className="space-y-1">
                      <p><strong>Important Notes:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Only send {displaySymbol} to this address</li>
                        <li>Minimum deposit: 0.001 {displaySymbol}</li>
                        <li>Deposits require network confirmations</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* QR Code Dialog */}
          <Dialog open={qrOpen} onOpenChange={setQrOpen}>
            <DialogContent className="max-w-sm bg-[hsl(var(--muted))] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">{symbol} Deposit Address</DialogTitle>
              </DialogHeader>
              {selectedAddress && (
                <div className="flex flex-col items-center p-4">
                  <div className="bg-white p-4 rounded-md border border-white/10 mb-4">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedAddress}`} 
                      alt={`QR Code for ${symbol} address`}
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-xs text-white font-mono break-all mb-2 text-center">
                    {selectedAddress}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    {copied ? 'Copied!' : 'Copy Address'}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;
