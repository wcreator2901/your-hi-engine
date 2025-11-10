import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Info, Clock, TrendingUp, Wallet, DollarSign, Timer } from 'lucide-react';
import { formatNumber } from '@/utils/currencyFormatter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EthStakingBoardProps {
  ethBalance: number;
  ethPriceUSD: number;
}

interface StakingData {
  id: string;
  user_id: string;
  asset_symbol: string;
  daily_yield_percent: number;
  total_profits_earned: number;
  staking_start_time: string;
  last_calculation_time: string;
  is_staking: boolean;
  accrued_profits: number;
  created_at: string;
  updated_at: string;
}

export const EthStakingBoard: React.FC<EthStakingBoardProps> = ({ ethBalance, ethPriceUSD }) => {
  const { user } = useAuth();
  
  // Fetch real staking data from database (optimized with realtime updates)
  const { data: stakingData, refetch: refetchStaking } = useQuery({
    queryKey: ['user-staking', user?.id],
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
      
      if (error) {
        console.error('Error fetching staking data:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5000, // Consider data fresh for 5 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true // Refetch when window regains focus
  });

  // Subscribe to realtime updates for staking changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('staking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_staking',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refetch when staking data changes
          refetchStaking();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchStaking]);

  // Start staking if user has ETH balance and no staking record
  const startStaking = async () => {
    if (!user?.id || ethBalance <= 0) return;
    
    // Check if already has staking record
    const { data: existing } = await supabase
      .from('user_staking')
      .select('id')
      .eq('user_id', user.id)
      .eq('asset_symbol', 'ETH')
      .maybeSingle();
    
    if (existing) {
      console.log('Staking already exists, skipping creation');
      return;
    }
    
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('user_staking')
        .insert({
          user_id: user.id,
          asset_symbol: 'ETH',
          daily_yield_percent: 0.0065,
          total_profits_earned: 0,
          accrued_profits: 0,
          staking_start_time: now,
          last_calculation_time: now,
          is_staking: true
        });
      
      if (error) {
        console.error('Error starting staking:', error);
      } else {
        refetchStaking();
      }
    } catch (error) {
      console.error('Error starting staking:', error);
    }
  };

  // Auto-start staking if conditions are met
  React.useEffect(() => {
    if (ethBalance > 0 && !stakingData && user?.id) {
      startStaking();
    }
  }, [ethBalance, stakingData, user?.id]);

  // Debug logging (removed to prevent console spam)

  // Default values if no staking data
  const displayData = stakingData || {
    is_staking: false,
    staking_start_time: new Date().toISOString(),
    daily_yield_percent: 0.0065,
    accrued_profits: 0,
    total_profits_earned: 0
  };
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Calculate live earnings
  const calculateLiveEarnings = useCallback(() => {
    if (!stakingData || !stakingData.is_staking) return 0;
    const start = new Date(stakingData.staking_start_time).getTime();
    const now = currentTime.getTime();
    const secondsPassed = (now - start) / 1000;
    const dailyRate = stakingData.daily_yield_percent ?? 0.0065; // fraction 0.0065 = 0.65%
    const secondlyRate = dailyRate / (24 * 60 * 60);
    // Profits accrue based on current ETH balance (liquid staking)
    return ethBalance * secondlyRate * secondsPassed;
  }, [stakingData, currentTime, ethBalance]);

  const accruedProfits = calculateLiveEarnings();
  const totalProfitsEarned = stakingData?.total_profits_earned || 0;

  // Update current time every second for live countdown (optimized)
  useEffect(() => {
    if (!displayData.is_staking) return; // Only run timer when actively staking
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [displayData.is_staking]);

  // Calculate time displays
  const getStakingDuration = useCallback(() => {
    if (!displayData.is_staking) return '00:00:00';
    const duration = currentTime.getTime() - new Date(displayData.staking_start_time).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [currentTime, displayData.is_staking, displayData.staking_start_time]);

  const getTimeToNextYield = useCallback(() => {
    if (!displayData.is_staking) return '00:00:00';
    const stakingStart = new Date(displayData.staking_start_time);
    const now = currentTime;
    const timeSinceStart = now.getTime() - stakingStart.getTime();
    
    // Calculate how many full 24-hour cycles have passed
    const millisecondsIn24Hours = 24 * 60 * 60 * 1000;
    const timeInCurrentCycle = timeSinceStart % millisecondsIn24Hours;
    const timeToNextCycle = millisecondsIn24Hours - timeInCurrentCycle;
    
    const hours = Math.floor(timeToNextCycle / (1000 * 60 * 60));
    const minutes = Math.floor((timeToNextCycle % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeToNextCycle % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [currentTime, displayData.is_staking, displayData.staking_start_time]);

  const getYieldProgress = useCallback(() => {
    if (!displayData.is_staking) return 0;
    const stakingStart = new Date(displayData.staking_start_time);
    const now = currentTime;
    const timeSinceStart = now.getTime() - stakingStart.getTime();
    
    // Calculate progress within current 24-hour cycle (0-100%)
    const millisecondsIn24Hours = 24 * 60 * 60 * 1000;
    const timeInCurrentCycle = timeSinceStart % millisecondsIn24Hours;
    const progress = (timeInCurrentCycle / millisecondsIn24Hours) * 100;
    
    return Math.min(progress, 100);
  }, [currentTime, displayData.is_staking, displayData.staking_start_time]);

  const totalWalletValue = ethBalance + accruedProfits + totalProfitsEarned;
  const totalWalletValueUSD = totalWalletValue * ethPriceUSD;
  const accruedProfitsUSD = accruedProfits * ethPriceUSD;
  const totalProfitsUSD = totalProfitsEarned * ethPriceUSD;
  const dailyYieldPercent = (displayData.daily_yield_percent || 0.0065) * 100;

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-[hsl(var(--background-card))] to-[hsl(var(--background-secondary))] border-[hsl(var(--accent-blue))]/20">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-1.5 sm:p-2 bg-[hsl(var(--accent-blue))]/10 rounded-xl">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-accent-blue" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#858585]">ETH Staking</h2>
          <p className="text-muted text-xs sm:text-sm">Automated Earnings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Accumulated Earnings Box */}
        <div className="bg-[hsl(var(--background-primary))]/50 rounded-xl p-4 sm:p-6 border border-[hsl(var(--border))]">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[hsl(var(--success-green))]" />
            <span className="text-xs sm:text-sm font-medium text-secondary">Accumulated Earnings</span>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <p className="text-xl sm:text-2xl font-bold text-[hsl(var(--success-green))] font-mono">
              {accruedProfits.toFixed(2)} ETH
            </p>
            <p className="text-base sm:text-lg text-muted">${formatNumber(accruedProfitsUSD)}</p>
            <p className="text-xs text-muted mt-2 sm:mt-3">Total Profits: {totalProfitsEarned.toFixed(2)} ETH</p>
          </div>
        </div>

        {/* Staking Status Box */}
        <div className="bg-[hsl(var(--background-primary))]/50 rounded-xl p-4 sm:p-6 border border-[hsl(var(--border))]">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-accent-blue" />
            <span className="text-xs sm:text-sm font-medium text-secondary">Status</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {displayData.is_staking ? (
              <>
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[hsl(var(--success-green))] rounded-full animate-pulse"></span>
                <span className="text-lg sm:text-xl font-bold text-[hsl(var(--success-green))]">Staking</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
                <span className="text-lg sm:text-xl font-bold text-red-500">Not Staking</span>
              </>
            )}
          </div>
          {displayData.is_staking && (
            <p className="text-xs sm:text-sm text-muted mt-2 sm:mt-3">
              Active for: {getStakingDuration()}
            </p>
          )}
        </div>
      </div>

      {/* Total Wallet Value Display - Mobile Optimized */}
      <div className="mt-4 sm:mt-6 bg-[hsl(var(--background-primary))]/50 rounded-xl p-4 sm:p-6 border border-[hsl(var(--border))]">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-accent-blue" />
          <span className="text-xs sm:text-sm font-medium text-secondary">Your ETH Wallet</span>
        </div>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-0">
            <span className="text-xs sm:text-sm text-muted">Base Balance:</span>
            <div className="text-left sm:text-right">
              <span className="text-base sm:text-lg font-semibold text-white">{ethBalance.toFixed(2)} ETH</span>
              <span className="text-xs sm:text-sm text-muted ml-2">(${formatNumber(ethBalance * ethPriceUSD)})</span>
            </div>
          </div>
          
          {totalProfitsEarned > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-0">
              <span className="text-xs sm:text-sm text-muted">Total Profits Earned:</span>
              <div className="text-left sm:text-right">
                <span className="text-base sm:text-lg font-semibold text-[hsl(var(--success-green))]">+{totalProfitsEarned.toFixed(2)} ETH</span>
                <span className="text-xs sm:text-sm text-muted ml-2">(+${formatNumber(totalProfitsUSD)})</span>
              </div>
            </div>
          )}
          
          <div className="pt-2 sm:pt-3 border-t border-[hsl(var(--border))] flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-0">
            <span className="text-xs sm:text-sm font-medium text-white">Total Wallet Value:</span>
            <div className="text-left sm:text-right">
              <span className="text-xl sm:text-2xl font-bold text-white">{totalWalletValue.toFixed(2)} ETH</span>
              <span className="text-sm sm:text-base text-muted ml-2">(${formatNumber(totalWalletValueUSD)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Staking Info */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 text-xs sm:text-sm text-muted">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Daily Yield: {dailyYieldPercent.toFixed(2)}% APY</span>
        </div>
        {displayData.is_staking && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Next yield in: {getTimeToNextYield()}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {displayData.is_staking && (
        <div className="mt-3 sm:mt-4">
          <Progress value={getYieldProgress()} className="h-1.5 sm:h-2" />
        </div>
      )}
    </Card>
  );
};