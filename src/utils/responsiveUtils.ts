/**
 * Utility functions for responsive design and touch accessibility
 */

// Touch target sizing for mobile accessibility (minimum 44px x 44px)
export const getTouchTarget = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizes = {
    sm: 'min-h-[36px] min-w-[36px]',
    md: 'min-h-[44px] min-w-[44px]',
    lg: 'min-h-[48px] min-w-[48px]'
  };
  return `${sizes[size]} touch-manipulation`;
};

// Responsive text sizing
export const getResponsiveText = (base: string) => {
  const textSizes: Record<string, string> = {
    'text-xs': 'text-xs sm:text-sm',
    'text-sm': 'text-sm sm:text-base',
    'text-base': 'text-base sm:text-lg',
    'text-lg': 'text-lg sm:text-xl',
    'text-xl': 'text-xl sm:text-2xl',
    'text-2xl': 'text-2xl sm:text-3xl'
  };
  return textSizes[base] || base;
};

// Responsive spacing
export const getResponsiveSpacing = (spacing: string) => {
  const spacingMap: Record<string, string> = {
    'p-2': 'p-2 sm:p-3',
    'p-3': 'p-3 sm:p-4',
    'p-4': 'p-4 sm:p-6',
    'px-3': 'px-3 sm:px-4',
    'px-4': 'px-4 sm:px-6',
    'py-2': 'py-2 sm:py-3',
    'py-3': 'py-3 sm:py-4'
  };
  return spacingMap[spacing] || spacing;
};

// Safe area insets for mobile devices
export const getSafeAreaClasses = () => {
  return 'safe-area-inset-top safe-area-inset-bottom safe-area-inset-left safe-area-inset-right';
};

// Focus styles for accessibility
export const getFocusStyles = (color: 'primary' | 'destructive' = 'primary') => {
  const colors = {
    primary: 'focus:ring-2 focus:ring-primary/20 focus:border-primary',
    destructive: 'focus:ring-2 focus:ring-destructive/20 focus:border-destructive'
  };
  return `focus-visible:outline-none ${colors[color]}`;
};

// High contrast mode support
export const getHighContrastStyles = () => {
  return 'contrast-more:border-2 contrast-more:text-foreground contrast-more:bg-background';
};

// Reduced motion support
export const getMotionStyles = () => {
  return 'motion-safe:transition-all motion-reduce:transition-none';
};