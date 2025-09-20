'use client'

import { useEffect } from 'react'
import { initPerformanceMonitoring, PerformanceOptimizer, addResourceHints, analyzeBundleSize } from '@/lib/performance'

export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring
    initPerformanceMonitoring()

    // Add resource hints for better loading performance
    addResourceHints()

    // Initialize performance optimizer
    const optimizer = PerformanceOptimizer.getInstance()

    // Set up lazy loading for images
    optimizer.initLazyLoading()

    // Start frame rate monitoring in development
    if (process.env.NODE_ENV === 'development') {
      optimizer.startFrameRateMonitoring()
      optimizer.monitorMemoryUsage()
      analyzeBundleSize()
    }

    // Preload critical resources
    optimizer.preloadCriticalResources([
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
      { href: '/api/auth/session', as: 'fetch' },
      { href: '/api/health', as: 'fetch' },
    ])

    // Cleanup on unmount
    return () => {
      optimizer.destroy()
    }
  }, [])

  // This component doesn't render anything visible
  return null
}