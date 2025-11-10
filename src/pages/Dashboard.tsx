import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Plus, LogOut, TrendingUp, TrendingDown, Shield, Zap, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWalletData } from '@/hooks/useWalletData';
import { useLivePrices } from '@/hooks/useLivePrices';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNumber } from '@/utils/currencyFormatter';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EthStakingBoard } from '@/components/EthStakingBoard';
import { EthPriceChart } from '@/components/EthPriceChart';
import { testSpecificSeed } from '@/utils/hdWallet';
import '@/utils/testSeed'; // This will run the test immediately
import ethereumGif from '@/assets/ethereum.gif';
import usdcLogo from '@/assets/usdc-logo.png';
import btcLogo from '@/assets/btc-logo.png';
import usdtTrc20Logo from '@/assets/usdt-trc20-logo.png';



const Dashboard = () => {
  const navigate = useNavigate();
  const { prices, isLoading: pricesLoading } = useLivePrices();
  const { walletData, totalBalanceUSD, loading: walletsLoading, refreshData } = useWalletData(prices);
  const { percentageChange, yesterdayValue, isLoading: performanceLoading } = usePortfolioPerformance(totalBalanceUSD);
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  console.log('📊 Portfolio Performance Debug:', {
    totalBalanceUSD,
    percentageChange,
    yesterdayValue,
    performanceLoading
  });

  console.log('Dashboard render - authLoading:', authLoading, 'user:', !!user, 'userEmail:', user?.email);

  // Test the specific seed phrase on component mount (only once)
  useEffect(() => {
    // Only run in development and once per session
    if (process.env.NODE_ENV === 'development' && !sessionStorage.getItem('seed-test-run')) {
      console.log('Testing BTC address generation for specific seed...');
      testSpecificSeed();
      sessionStorage.setItem('seed-test-run', 'true');
    }
  }, []);

  // Real-time subscription for wallet updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up real-time subscription for wallet updates...');
    
    const channel = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('💰 Wallet update received:', payload);
          refreshData();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up wallet subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshData]);


  // Show loading only while auth is still loading
  if (authLoading) {
    console.log('Dashboard - showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[hsl(var(--accent-blue))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary text-responsive-sm">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  // If not loading and no user, redirect to auth
  if (!user) {
    console.log('Dashboard - no user found, redirecting to auth');
    navigate('/auth');
    return null;
  }

  console.log('Dashboard - rendering main content for user:', user?.email);

  const getCryptoId = (symbol: string, network?: string): string => {
    switch (symbol) {
      case 'ETH':
        return 'ethereum';
      case 'BTC':
        return 'bitcoin';
      case 'USDT':
        if (network === 'ERC-20') {
          return 'tether-erc20';
        } else {
          return 'tether-erc20'; // default to ERC-20
        }
      case 'USDT-ERC20':
        return 'tether-erc20';
      case 'USDT_TRON':
      case 'USDT-TRC20':
        return 'tether-erc20'; // Use same price as ERC20 USDT
      case 'USDC':
      case 'USDC-ERC20':
        return 'usd-coin';
      default:
        return symbol.toLowerCase();
    }
  };

  const getCurrencyName = (symbol: string): string => {
    switch (symbol) {
      case 'ETH':
        return 'Ethereum';
      case 'USDT':
        return 'Tether';
      default:
        return symbol;
    }
  };

  const getCryptoLogo = (symbol: string): string => {
    switch (symbol) {
      case 'ETH':
        return '/lovable-uploads/7fdca632-484d-4cd9-9f1a-c3e78b8b4e89.png';  
      case 'USDT':
      case 'USDT-ERC20':
        return '/lovable-uploads/e8142317-83a5-4e7e-878f-bf01ac1a53fd.png';
      case 'USDT_TRON':
      case 'USDT-TRC20':
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

  const defaultWallets = [
    {
      id: 'default-eth',
      symbol: 'ETH',
      balance: { crypto: 0, fiat: 0 }
    },
    {
      id: 'default-usdt-erc20',
      symbol: 'USDT-ERC20',
      balance: { crypto: 0, fiat: 0 }
    },
    {
      id: 'default-usdc-erc20',
      symbol: 'USDC-ERC20',
      balance: { crypto: 0, fiat: 0 }
    },
    {
      id: 'default-btc',
      symbol: 'BTC',
      balance: { crypto: 0, fiat: 0 }
    },
    {
      id: 'default-usdt-tron',
      symbol: 'USDT_TRON',
      balance: { crypto: 0, fiat: 0 }
    },
  ];

  // Custom sorting function to order wallets as: ETH, USDT-ERC20, USDC-ERC20, BTC, USDT_TRON
  const getSortOrder = (wallet: any): number => {
    const symbol = wallet.symbol || wallet.asset_symbol;
    if (symbol === 'ETH') return 1;
    if (symbol === 'USDT-ERC20' || (symbol === 'USDT' && wallet.network === 'ERC-20')) return 2;
    if (symbol === 'USDC-ERC20' || (symbol === 'USDC' && wallet.network === 'ERC-20')) return 3;
    if (symbol === 'BTC') return 4;
    if (symbol === 'USDT_TRON' || symbol === 'USDT-TRC20') return 5;
    return 999; // Any other assets go to the end
  };

  const walletsToShow = (walletData && walletData.length > 0 ? walletData : defaultWallets).sort((a, b) => getSortOrder(a) - getSortOrder(b));
  
  // Get ETH balance
  const ethWallet = walletsToShow.find(wallet => wallet.symbol === 'ETH');
  const ethBalance = ethWallet?.balance.crypto || 0;
  
  // Fetch staking data for ETH (optimized to prevent duplicate queries)
  const { data: stakingData } = useQuery({
    queryKey: ['dashboard-staking', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_staking')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_staking', true)
        .order('total_profits_earned', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching staking data:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 second cache
    refetchInterval: 120000 // Refetch every 2 minutes instead of constantly
  });
  
  // Calculate total balance including staking profits for portfolio display
  const totalStakingProfits = stakingData?.total_profits_earned || 0;
  const adjustedTotalBalanceUSD = totalBalanceUSD + (totalStakingProfits * (prices['ethereum'] || 0));

  const handleDeposit = (symbol: string, network?: string) => {
    const assetSymbol = network ? `${symbol}-${network.toLowerCase().replace('-', '')}` : symbol;
    navigate(`/dashboard/asset/${assetSymbol}`);
  };

  const handleBuyCrypto = () => {
    navigate('/dashboard/deposit');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background-primary))] via-[hsl(var(--background-secondary))] to-[hsl(var(--background-card))] relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[hsl(var(--accent-blue))]/5 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(var(--accent-purple))]/5 rounded-full blur-3xl floating-animation" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6 md:space-y-8 py-4 sm:py-6 md:py-8 relative z-10">
        {/* Welcome Section */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 fade-in">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 text-white drop-shadow-lg px-4">
            Welcome to Pulse Wallet
          </h1>
          <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Secured & Encrypted | Maximize your returns with our professional staking platform.
          </p>
        </div>

        {/* Portfolio Balance Card */}
        <div className="balance-card fade-in relative overflow-hidden" style={{animationDelay: '0.1s'}}>
          {/* Background gradient overlay for contrast */}
          <div className="absolute inset-0 bg-[#575757]"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between h-full min-h-[180px] sm:min-h-[200px] px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
            {/* Left side - Text content */}
            <div className="w-full sm:flex-1 sm:pr-4 md:pr-8">
              {/* Header section */}
              <div className="mb-2 sm:mb-4 md:mb-6 w-full text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 md:gap-3 mb-1.5 sm:mb-2 md:mb-3 w-full">
                  <div className="icon-container">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
                  </div>
                  <h2 className="portfolio-balance-title w-full sm:w-auto text-center sm:text-left text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">Portfolio Balance</h2>
                </div>
                <p className="portfolio-balance-caption w-full text-center sm:text-left text-white/60 text-base sm:text-lg md:text-xl lg:text-2xl flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 md:gap-2 font-medium sm:ml-7 md:ml-11">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                  Secured & Encrypted
                </p>
              </div>
              
              {/* Balance section */}
              <div className="w-full text-center sm:text-left sm:ml-7 md:ml-11">
                <div className="flex flex-col sm:flex-row items-center sm:items-baseline justify-center sm:justify-start gap-1 sm:gap-2 md:gap-3 mb-1 sm:mb-1.5 md:mb-2 w-full">
                  {(walletsLoading || pricesLoading) ? (
                    <div className="w-32 h-6 sm:w-40 sm:h-8 md:w-48 md:h-10 lg:h-12 bg-[hsl(var(--muted))] rounded-xl animate-pulse mx-auto sm:mx-0"></div>
                  ) : (
                      <>
                       <span className="portfolio-balance-value w-full sm:w-auto text-center sm:text-left text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white break-words">
                          ${formatNumber(adjustedTotalBalanceUSD)}
                       </span>
                       {console.log('💰 Dashboard Portfolio Balance Debug:', {
                         totalBalanceUSD,
                         adjustedTotalBalanceUSD,
                         totalStakingProfits,
                         walletData,
                         walletsLoading,
                         prices
                       })}
                        {percentageChange !== null && adjustedTotalBalanceUSD > 0 && (
                         <span className={`text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 md:gap-2 font-semibold whitespace-nowrap ${
                           percentageChange >= 0 ? 'text-[hsl(var(--success-green))]' : 'text-[hsl(var(--destructive))]'
                         }`}>
                           {percentageChange >= 0 ? (
                             <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" />
                           ) : (
                             <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" />
                           )}
                           {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
                         </span>
                       )}
                     </>
                   )}
                 </div>
                  <p className="portfolio-balance-usd w-full sm:w-auto text-center sm:text-left text-white/70 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold">
                    Total USD Value
                    {yesterdayValue > 0 && (
                      <span className="ml-1 sm:ml-2 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl opacity-70">
                        (Yesterday: ${formatNumber(yesterdayValue)})
                      </span>
                    )}
                  </p>
              </div>
            </div>
            
            {/* Right side - Large Ethereum logo - hidden on mobile */}
            <div className="hidden lg:flex flex-shrink-0 relative mt-4 sm:mt-0">
              <div className="w-32 h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 flex items-center justify-center">
                <img 
                  src={ethereumGif} 
                  alt="Ethereum animation" 
                  className="w-full h-full object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
              {/* Subtle glow effect behind logo */}
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent-blue))]/20 to-[hsl(var(--accent-purple))]/20 rounded-full blur-xl -z-10 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Wallets Grid */}
        <div className="wallet-card fade-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Your Digital Assets</h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={async () => {
                  setIsRefreshing(true);
                  await refreshData();
                  toast({
                    title: "Refreshed",
                    description: "Wallet data has been updated",
                  });
                  setIsRefreshing(false);
                }}
                variant="ghost"
                size="sm"
                disabled={isRefreshing}
                className="text-white/70 hover:text-white hover:bg-[hsl(var(--muted))] transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <div className="text-xs sm:text-sm text-white/70 bg-[hsl(var(--muted))] px-2 sm:px-3 py-1 rounded-full border border-white/10 font-medium">
                {walletsToShow.length} Assets
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {(walletsLoading || pricesLoading) ? (
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 sm:h-20 bg-[hsl(var(--muted))] rounded-2xl animate-pulse border border-[hsl(var(--border))]"></div>
                ))}
              </div>
            ) : (
              walletsToShow.map((wallet, index) => {
                const cryptoId = getCryptoId(wallet.symbol, wallet.network);
                const currentPrice = prices[cryptoId] || 0;
                const currentValue = wallet.balance.crypto * currentPrice;
                
                // Determine display name based on asset
                let displayName = '';
                let walletNameSubtitle = '';
                
                if (wallet.symbol === 'ETH') {
                  displayName = 'ETH';
                  walletNameSubtitle = 'Ethereum Wallet';
                } else if (wallet.symbol === 'USDT-ERC20') {
                  displayName = 'USDT [ERC20]';
                  walletNameSubtitle = 'USDT-ERC20 Wallet';
                } else if (wallet.symbol === 'USDC-ERC20') {
                  displayName = 'USDC [ERC20]';
                  walletNameSubtitle = 'USDC-ERC20 Wallet';
                } else if (wallet.symbol === 'BTC') {
                  displayName = 'BTC [Bitcoin]';
                  walletNameSubtitle = 'Bitcoin Wallet';
                } else if (wallet.symbol === 'USDT_TRON') {
                  displayName = 'USDT [TRC20]';
                  walletNameSubtitle = 'USDT_TRON Wallet';
                } else {
                  displayName = wallet.symbol;
                  walletNameSubtitle = `${wallet.symbol} Wallet`;
                }
                
                const logoUrl = getCryptoLogo(wallet.symbol);
                
                // Check if this is ETH and has staking data
                const isEthWallet = wallet.symbol === 'ETH';
                const hasStaking = isEthWallet && stakingData?.is_staking;
                const totalProfitsEarned = stakingData?.total_profits_earned || 0;
                const baseBalance = wallet.balance.crypto;
                const totalBalance = baseBalance + totalProfitsEarned;
                const stakingValue = totalProfitsEarned * currentPrice;
                const baseBalanceUSD = baseBalance * currentPrice;
                const totalValueUSD = totalBalance * currentPrice;
                
                return (
                  <div 
                    key={wallet.id} 
                    className="asset-card group"
                    style={{animationDelay: `${0.1 * index}s`}}
                  >
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 pr-14 sm:pr-16 md:pr-20 w-full">
                      {/* Left section: Icon + Name + Price Badge + Subtitle */}
                      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-1 min-w-0">
                        <div className="icon-container flex-shrink-0">
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt={`${wallet.symbol} logo`}
                              className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-primary text-xs sm:text-sm font-bold">${wallet.symbol.slice(0, 2)}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-primary text-xs sm:text-sm font-bold">
                              {wallet.symbol.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <p className="font-semibold text-white text-sm sm:text-base">
                              {displayName}
                            </p>
                            <span className="hidden sm:inline-flex text-[hsl(var(--success-green))] text-xs font-semibold bg-[hsl(var(--success-green))]/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-[hsl(var(--success-green))]/20">
                              ${formatNumber(currentPrice)}
                            </span>
                            {hasStaking && (
                              <span className="inline-flex text-[hsl(var(--success-green))] text-xs font-semibold bg-[hsl(var(--success-green))]/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-[hsl(var(--success-green))]/20 items-center gap-1">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[hsl(var(--success-green))] rounded-full animate-pulse"></div>
                                Staking
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                            <p className="text-white/60 text-xs sm:text-sm">{walletNameSubtitle}</p>
                            {hasStaking && (
                              <span className="text-[hsl(var(--success-green))] text-xs sm:text-sm font-medium hidden sm:inline">
                                +{totalProfitsEarned.toFixed(2)} ETH total earned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Middle section: Balance details */}
                      <div className="text-left sm:text-right min-w-0">
                        {isEthWallet && hasStaking ? (
                          <div className="flex flex-col space-y-2">
                            {/* Base Balance */}
                            <div className="flex flex-col">
                              <p className="font-bold text-white text-base sm:text-lg leading-tight">
                                {baseBalance.toFixed(2)} ETH
                              </p>
                              <p className="text-xs text-white/60 leading-tight mt-0.5">
                                Base Balance • ${formatNumber(baseBalanceUSD)}
                              </p>
                            </div>
                            
                            {/* Staking Earnings in green */}
                            {totalProfitsEarned > 0 && (
                              <div className="flex flex-col">
                                <p className="text-xs text-[hsl(var(--success-green))] leading-tight mt-0.5">
                                  Staking Earnings • +${formatNumber(stakingValue)}
                                </p>
                              </div>
                            )}
                            
                            {/* Wallet subtitle */}
                            <p className="text-white/60 text-xs leading-tight">
                              Ethereum Wallet
                            </p>
                            
                            {/* Total Value display */}
                            <div className="pt-2 border-t border-white/10 flex flex-col">
                              <p className="font-bold text-white text-sm sm:text-base leading-tight">
                                {totalBalance.toFixed(2)} ETH
                              </p>
                              <p className="text-white/60 text-xs leading-tight mt-0.5">
                                Total Value • ${formatNumber(totalValueUSD)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-white text-sm sm:text-base">
                              {wallet.balance.crypto.toFixed(2)} {wallet.symbol === 'USDT_TRON' ? 'USDT' : wallet.symbol.replace('-ERC20', '')}
                            </p>
                            <p className="text-white/60 text-xs sm:text-sm">
                              ${formatNumber(currentValue)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Right section: Plus button at absolute right */}
                      <button
                        onClick={() => handleDeposit(wallet.symbol, wallet.network)}
                        className="absolute top-3 right-3 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-[hsl(var(--success-green))]/10 hover:bg-[hsl(var(--success-green))]/20 border border-[hsl(var(--success-green))]/20 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--success-green))] focus:ring-offset-2 min-h-[44px] touch-manipulation"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[hsl(var(--success-green))]" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ETH/USD Price Chart */}
        <div className="fade-in" style={{animationDelay: '0.3s'}}>
          <EthPriceChart />
        </div>



      </div>


    </div>
  );
};

export default Dashboard;
