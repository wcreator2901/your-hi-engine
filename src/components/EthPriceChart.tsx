import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useLivePrices } from '@/hooks/useLivePrices';
import { fetchHistoricalETHPrices } from '@/services/historicalPriceService';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface PricePoint {
  date: string;
  price: number;
  volume: number;
  timestamp: number;
}

export const EthPriceChart = () => {
  const { getPriceForCrypto } = useLivePrices();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangeAbsolute, setPriceChangeAbsolute] = useState(0);

  const currentPrice = getPriceForCrypto('ethereum');

  // Fetch historical data on component mount
  useEffect(() => {
    const loadHistoricalData = async () => {
      setLoading(true);
      try {
        const historicalData = await fetchHistoricalETHPrices(60); // 2 months
        
        const formattedData: PricePoint[] = historicalData.map(point => ({
          date: format(new Date(point.timestamp), 'MMM dd'),
          price: point.price,
          volume: point.volume,
          timestamp: point.timestamp
        }));
        
        setPriceHistory(formattedData);
        
        // Calculate price change over 2 months
        if (formattedData.length >= 2) {
          const oldPrice = formattedData[0].price;
          const latestPrice = formattedData[formattedData.length - 1].price;
          const change = ((latestPrice - oldPrice) / oldPrice) * 100;
          const absoluteChange = latestPrice - oldPrice;
          setPriceChange(change);
          setPriceChangeAbsolute(absoluteChange);
        }
      } catch (error) {
        console.error('Failed to load historical data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalData();
  }, []);

  // Update the latest price point with live data
  useEffect(() => {
    if (currentPrice > 0 && priceHistory.length > 0) {
      setPriceHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        
        // Update today's price with current live price
        const today = format(new Date(), 'MMM dd');
        if (updated[lastIndex].date === today) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            price: currentPrice
          };
        } else {
          // Add new data point for today
          updated.push({
            date: today,
            price: currentPrice,
            volume: updated[lastIndex]?.volume || 1000000000,
            timestamp: Date.now()
          });
        }
        
        // Recalculate price change with live data
        if (updated.length >= 2) {
          const oldPrice = updated[0].price;
          const change = ((currentPrice - oldPrice) / oldPrice) * 100;
          const absoluteChange = currentPrice - oldPrice;
          setPriceChange(change);
          setPriceChangeAbsolute(absoluteChange);
        }
        
        return updated;
      });
    }
  }, [currentPrice, priceHistory.length]);

  const isPositive = priceChange >= 0;

  if (loading) {
    return (
      <div className="fade-in">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-white/70">Loading historical data...</span>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <Card className="glass-card overflow-hidden">
        {/* Header with price info */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">Ξ</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Ethereum / U.S. Dollar</h3>
                <p className="text-xs text-white/70">ETH/USD • 2 Month History</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-white" />
              <span className="text-xs text-white font-medium">LIVE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold text-white">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-white" />
              ) : (
                <TrendingDown className="w-4 h-4 text-[hsl(var(--error-red))]" />
              )}
              <span className={`font-medium ${isPositive ? 'text-white' : 'text-[hsl(var(--error-red))]'}`}>
                {isPositive ? '+' : ''}${Math.abs(priceChangeAbsolute).toFixed(2)} ({isPositive ? '+' : ''}{priceChange.toFixed(2)}%)
              </span>
              <span className="text-xs text-white/70 ml-1">2M</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Main price chart */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistory} margin={{ top: 5, right: 15, left: 15, bottom: 5 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(255, 255, 255, 0.3)" stopOpacity={1}/>
                    <stop offset="95%" stopColor="rgba(255, 255, 255, 0)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255, 255, 255, 0.1)" 
                  opacity={0.5}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'rgba(255, 255, 255, 0.7)' }}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis 
                  domain={['dataMin - 100', 'dataMax + 100']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'rgba(255, 255, 255, 0.7)' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  orientation="right"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(210 11% 12%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: any, name: string) => [
                    `$${value.toFixed(2)}`,
                    'Price'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                  labelStyle={{ color: 'white' }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  fill="url(#priceGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#FFFFFF', stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Volume chart */}
          <div className="h-16 w-full border-t border-white/10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceHistory} margin={{ top: 5, right: 15, left: 15, bottom: 5 }}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(210 11% 12%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                  }}
                  formatter={(value: any) => [
                    `$${(value / 1000000000).toFixed(1)}B`,
                    'Volume'
                  ]}
                  labelStyle={{ color: 'white' }}
                />
                <Bar 
                  dataKey="volume" 
                  fill="rgba(255, 255, 255, 0.3)" 
                  opacity={0.6}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Bottom info bar */}
          <div className="px-4 py-2 bg-card/50 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>
                Data: {priceHistory.length} days • Source: CoinGecko
              </span>
              <span>2M History</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
