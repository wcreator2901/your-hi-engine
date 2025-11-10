// Portfolio performance feature disabled - requires portfolio_snapshots table
// This hook is a placeholder to prevent build errors

export const usePortfolioPerformance = (currentPortfolioValue: number) => {
  return {
    percentageChange: null,
    yesterdayValue: 0,
    isLoading: false,
    error: null,
  };
};
