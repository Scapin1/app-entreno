import { useState, useEffect } from 'react'

export const useBreakpoint = () => {
  const getCurrentBreakpoint = () => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isWide: false,
        width: 0,
      }
    }

    const width = window.innerWidth
    return {
      isMobile: width < 480,
      isTablet: width >= 480 && width < 768,
      isDesktop: width >= 1024,
      isWide: width >= 1440,
      width,
    }
  }

  const [breakpoint, setBreakpoint] = useState(getCurrentBreakpoint)

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getCurrentBreakpoint())
    }

    // Set initial value
    handleResize()

    // Listen for changes
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return breakpoint
}

export default useBreakpoint
