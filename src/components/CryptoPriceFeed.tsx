import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

export const CryptoPriceFeed = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h'
        );
        const data = await response.json();
        setCryptoData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch crypto data:', error);
        setLoading(false);
      }
    };

    fetchCryptoData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchCryptoData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-16">
            <div className="w-6 h-6 border-2 border-[hsl(var(--accent-blue))] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-[hsl(var(--text-secondary))] text-sm">Loading crypto prices...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-[hsl(var(--accent-blue))]/10 to-[hsl(var(--accent-purple))]/10 px-4 py-2 border-b border-[hsl(var(--border))]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))]">
              Live Crypto Prices
            </h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-[hsl(var(--success-green))] rounded-full animate-pulse"></div>
              <span className="text-xs text-[hsl(var(--text-secondary))]">Live</span>
            </div>
          </div>
        </div>
        
        <div className="relative overflow-hidden h-16">
          <div className="absolute inset-0 animate-scroll flex items-center gap-6 whitespace-nowrap">
            {/* Duplicate the data for seamless scrolling */}
            {[...cryptoData, ...cryptoData].map((crypto, index) => (
              <div key={`${crypto.id}-${index}`} className="flex items-center gap-2 flex-shrink-0 px-2">
                <img 
                  src={crypto.image} 
                  alt={crypto.name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-[hsl(var(--text-primary))]">
                    {crypto.symbol.toUpperCase()}
                  </span>
                  <span className="text-sm text-[hsl(var(--text-primary))]">
                    ${crypto.current_price.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: crypto.current_price < 1 ? 6 : 2 
                    })}
                  </span>
                  <div className={`flex items-center gap-1 ${
                    crypto.price_change_percentage_24h >= 0 
                      ? 'text-[hsl(var(--success-green))]' 
                      : 'text-[hsl(var(--error-red))]'
                  }`}>
                    {crypto.price_change_percentage_24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs">
                      {Math.abs(crypto.price_change_percentage_24h).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};