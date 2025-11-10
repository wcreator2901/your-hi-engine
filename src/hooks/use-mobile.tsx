
import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`)
    const onChange = () => {
      setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isDesktop
}

export function useBreakpoint() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()

  return React.useMemo(() => {
    if (isMobile) return 'mobile'
    if (isTablet) return 'tablet'
    if (isDesktop) return 'desktop'
    return 'unknown'
  }, [isMobile, isTablet, isDesktop])
}

// Enhanced mobile detection utilities
export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  React.useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', updateScreenSize)
    updateScreenSize()

    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return screenSize
}

export function useOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait')

  React.useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)
    updateOrientation()

    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  return orientation
}

export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = React.useState(false)

  React.useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return isTouchDevice
}

// Hook for safe area insets (mobile notches, etc.)
export function useSafeAreaInsets() {
  const [insets, setInsets] = React.useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })

  React.useEffect(() => {
    const updateInsets = () => {
      const style = getComputedStyle(document.documentElement)
      setInsets({
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      })
    }

    updateInsets()
    window.addEventListener('resize', updateInsets)
    window.addEventListener('orientationchange', updateInsets)

    return () => {
      window.removeEventListener('resize', updateInsets)
      window.removeEventListener('orientationchange', updateInsets)
    }
  }, [])

  return insets
}
