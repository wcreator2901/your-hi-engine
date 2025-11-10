
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Import crypto logos
import usdtLogo from '/lovable-uploads/e8142317-83a5-4e7e-878f-bf01ac1a53fd.png';
import usdcLogo from '@/assets/usdc-logo.png';
import btcLogo from '@/assets/btc-logo.png';
import usdtTrc20Logo from '@/assets/usdt-trc20-logo.png';

interface DepositWalletCardProps {
  symbol: string;
  name: string;
  address: string;
  network?: string | null;
  price: number;
}

const DepositWalletCard: React.FC<DepositWalletCardProps> = ({
  symbol,
  name,
  address,
  network,
  price
}) => {
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const networkLabel = network ? ` (${network.toUpperCase()})` : '';
  
  // Format price properly - handle both 0 and valid prices
  const formattedPrice = price && price > 0 ? price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) : '0.00';

  // Get appropriate logo for the crypto
  const getCryptoLogo = (symbol: string) => {
    switch (symbol.toLowerCase()) {
      case 'usdt':
      case 'usdt-erc20':
        return usdtLogo;
      case 'usdt_tron':
      case 'usdt-trc20':
        return usdtTrc20Logo;
      case 'usdc':
      case 'usdc-erc20':
        return usdcLogo;
      case 'btc':
      case 'bitcoin':
        return btcLogo;
      default:
        return null;
    }
  };

  const cryptoLogo = getCryptoLogo(symbol);
  
  return (
    <Card className="card-responsive h-full bg-white dark:bg-slate-800">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-3 overflow-hidden">
            {cryptoLogo ? (
              <img src={cryptoLogo} alt={`${symbol} logo`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">{symbol}</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base">{name}{networkLabel}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Current price: ${formattedPrice}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-mono break-all">{address}</p>
        </div>
        
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          className="w-full text-xs sm:text-sm bg-black text-white hover:bg-gray-800 border-black"
          onClick={copyAddress}
        >
          {copied ? (
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-white" />
          ) : (
            <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-white" />
          )}
          {copied ? 'Copied!' : 'Copy Address'}
        </Button>
      </div>
    </Card>
  );
};

export default DepositWalletCard;
