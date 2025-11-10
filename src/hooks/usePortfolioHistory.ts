import { useAuth } from '@/contexts/AuthContext';

// Portfolio history feature disabled - requires portfolio_snapshots table
// This hook is a placeholder to prevent build errors

export const usePortfolioHistory = () => {
  const { user } = useAuth();

  return {
    yesterdaySnapshot: null,
    savePortfolioSnapshot: () => {},
    isSaving: false,
    calculatePercentageChange: (currentValue: number) => ({ percentage: 0, isPositive: true }),
  };
};
