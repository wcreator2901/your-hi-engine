
/**
 * Responsive utility functions for consistent responsive behavior
 */

export const getResponsiveCardPadding = (isMobile: boolean) => {
  return isMobile ? 'p-4' : 'p-6';
};

export const getResponsiveTextSize = (size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl', isMobile: boolean) => {
  const baseSizes = {
    xs: isMobile ? 'text-xs' : 'text-sm',
    sm: isMobile ? 'text-sm' : 'text-base',
    base: isMobile ? 'text-base' : 'text-lg',
    lg: isMobile ? 'text-lg' : 'text-xl',
    xl: isMobile ? 'text-xl' : 'text-2xl',
    '2xl': isMobile ? 'text-2xl' : 'text-3xl',
    '3xl': isMobile ? 'text-3xl' : 'text-4xl',
  };
  
  return baseSizes[size];
};

export const getResponsiveButtonSize = (isMobile: boolean) => {
  return isMobile ? 'sm' : 'default';
};

export const getResponsiveSpacing = (size: 'sm' | 'md' | 'lg', isMobile: boolean) => {
  const spacings = {
    sm: isMobile ? 'space-y-2' : 'space-y-3',
    md: isMobile ? 'space-y-3' : 'space-y-4',
    lg: isMobile ? 'space-y-4' : 'space-y-6',
  };
  
  return spacings[size];
};

export const getResponsiveGridCols = (cols: number, isMobile: boolean) => {
  if (isMobile) {
    return 'grid-cols-1';
  }
  
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };
  
  return gridCols[cols as keyof typeof gridCols] || 'grid-cols-1';
};

export const getResponsiveIconSize = (size: 'sm' | 'md' | 'lg', isMobile: boolean) => {
  const sizes = {
    sm: isMobile ? 'w-4 h-4' : 'w-5 h-5',
    md: isMobile ? 'w-5 h-5' : 'w-6 h-6',
    lg: isMobile ? 'w-6 h-6' : 'w-8 h-8',
  };
  
  return sizes[size];
};

export const getResponsiveContainerPadding = (isMobile: boolean) => {
  return isMobile ? 'px-4 py-4' : 'px-6 py-6';
};

export const getResponsiveMaxWidth = (size: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };
  
  return maxWidths[size];
};

// Touch target helpers for mobile accessibility
export const getTouchTargetClass = () => {
  return 'min-h-[44px] min-w-[44px] touch-manipulation';
};

// Safe area helpers
export const getSafeAreaClass = (position: 'top' | 'bottom' | 'left' | 'right' | 'all') => {
  const safeAreas = {
    top: 'safe-area-inset-top',
    bottom: 'safe-area-inset-bottom',
    left: 'safe-area-inset-left',
    right: 'safe-area-inset-right',
    all: 'safe-area-inset-top safe-area-inset-bottom safe-area-inset-left safe-area-inset-right',
  };
  
  return safeAreas[position];
};

// Responsive breakpoint helpers
export const getBreakpointClass = (mobile: string, tablet: string, desktop: string) => {
  return `${mobile} md:${tablet} lg:${desktop}`;
};
