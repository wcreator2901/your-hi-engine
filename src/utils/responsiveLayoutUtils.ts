/**
 * Responsive Layout Utilities
 * Centralized utilities for consistent responsive behavior across the app
 */

// Container classes for consistent responsive behavior
export const getResponsiveContainer = (size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'lg') => {
  const containers = {
    sm: 'max-w-sm mx-auto px-4',
    md: 'max-w-md mx-auto px-4',
    lg: 'max-w-4xl mx-auto px-4 sm:px-6',
    xl: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8',
    full: 'w-full px-4 sm:px-6 lg:px-8'
  };
  return containers[size];
};

// Responsive spacing utilities
export const getResponsiveSpacing = (type: 'padding' | 'margin' | 'gap', size: 'sm' | 'md' | 'lg') => {
  const spacings = {
    padding: {
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8'
    },
    margin: {
      sm: 'm-3 sm:m-4',
      md: 'm-4 sm:m-6',
      lg: 'm-6 sm:m-8'
    },
    gap: {
      sm: 'gap-3 sm:gap-4',
      md: 'gap-4 sm:gap-6',
      lg: 'gap-6 sm:gap-8'
    }
  };
  return spacings[type][size];
};

// Text overflow handling
export const getTextOverflowClasses = (strategy: 'truncate' | 'break' | 'wrap' = 'truncate') => {
  const strategies = {
    truncate: 'truncate overflow-hidden whitespace-nowrap',
    break: 'break-words overflow-hidden',
    wrap: 'break-words whitespace-normal'
  };
  return strategies[strategy];
};

// Grid responsive utilities
export const getResponsiveGrid = (cols: 1 | 2 | 3 | 4 | 'auto') => {
  const grids = {
    1: 'grid grid-cols-1',
    2: 'grid grid-cols-1 sm:grid-cols-2',
    3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    auto: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  };
  return grids[cols];
};

// Layout overflow fixes
export const getLayoutConstraints = () => {
  return 'min-w-0 max-w-full overflow-x-hidden';
};

// Safe area utilities for mobile devices
export const getSafeAreaPadding = (sides: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom']) => {
  const safeAreaClasses = sides.map(side => `safe-area-inset-${side}`).join(' ');
  return safeAreaClasses;
};

// Mobile-first breakpoint utilities
export const getBreakpointClasses = (mobile: string, tablet?: string, desktop?: string) => {
  let classes = mobile;
  if (tablet) classes += ` sm:${tablet}`;
  if (desktop) classes += ` lg:${desktop}`;
  return classes;
};

// Dialog/Modal responsive sizing
export const getResponsiveDialogSize = (size: 'sm' | 'md' | 'lg' | 'xl' | 'full') => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg sm:max-w-xl lg:max-w-2xl',
    xl: 'max-w-xl sm:max-w-2xl lg:max-w-4xl',
    full: 'max-w-[95vw] sm:max-w-[90vw] lg:max-w-[85vw]'
  };
  return sizes[size];
};