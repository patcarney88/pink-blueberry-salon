import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Set initial value
    setMatches(media.matches)

    // Create event listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add event listener
    media.addEventListener('change', listener)

    // Clean up
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Preset breakpoint hooks
export function useMobile() {
  return useMediaQuery('(max-width: 640px)')
}

export function useTablet() {
  return useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
}

export function useDesktop() {
  return useMediaQuery('(min-width: 1025px)')
}