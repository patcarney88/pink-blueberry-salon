// Performance monitoring and Core Web Vitals optimization
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

type MetricName = 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB'

interface PerformanceMetric {
  name: MetricName
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  entries: PerformanceEntry[]
}

// Thresholds based on Google's Core Web Vitals
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
}

function getRating(metricName: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = THRESHOLDS[metricName]
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

// Send metrics to analytics
function sendToAnalytics(metric: PerformanceMetric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  })

  // Use sendBeacon if available, fallback to fetch
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/api/analytics/web-vitals', body)
  } else {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(console.error)
  }
}

// Initialize Web Vitals monitoring
export function initPerformanceMonitoring() {
  // Only run in production and in browser
  if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') {
    return
  }

  function handleMetric(metric: any) {
    const enhancedMetric: PerformanceMetric = {
      ...metric,
      rating: getRating(metric.name, metric.value),
    }

    sendToAnalytics(enhancedMetric)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${metric.name}: ${metric.value} (${enhancedMetric.rating})`)
    }
  }

  // Collect all Core Web Vitals
  getCLS(handleMetric)
  getFID(handleMetric)
  getFCP(handleMetric)
  getLCP(handleMetric)
  getTTFB(handleMetric)
}

// Performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private metrics: Map<string, number> = new Map()
  private observer?: IntersectionObserver

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  // Lazy load images with intersection observer
  initLazyLoading() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute('data-src')
              this.observer?.unobserve(img)
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach((img) => {
      this.observer?.observe(img)
    })
  }

  // Preload critical resources
  preloadCriticalResources(resources: { href: string; as: string; type?: string }[]) {
    resources.forEach(({ href, as, type }) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      if (type) link.type = type
      document.head.appendChild(link)
    })
  }

  // Monitor frame rate
  startFrameRateMonitoring() {
    if (typeof window === 'undefined') return

    let frames = 0
    let lastTime = performance.now()

    const measureFPS = () => {
      frames++
      const currentTime = performance.now()

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime))
        this.metrics.set('fps', fps)

        // Log poor performance
        if (fps < 30) {
          console.warn(`Low frame rate detected: ${fps} FPS`)
        }

        frames = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFPS)
    }

    requestAnimationFrame(measureFPS)
  }

  // Memory monitoring
  monitorMemoryUsage() {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return
    }

    setInterval(() => {
      const memory = (performance as any).memory
      const usedMemory = memory.usedJSHeapSize / 1024 / 1024 // MB
      const totalMemory = memory.totalJSHeapSize / 1024 / 1024 // MB

      this.metrics.set('memoryUsed', usedMemory)
      this.metrics.set('memoryTotal', totalMemory)

      // Warn if memory usage is high
      if (usedMemory > 100) {
        console.warn(`High memory usage: ${usedMemory.toFixed(2)} MB`)
      }
    }, 5000)
  }

  // Get current metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  // Clean up
  destroy() {
    this.observer?.disconnect()
    this.metrics.clear()
  }
}

// Resource hints for critical paths
export function addResourceHints() {
  if (typeof document === 'undefined') return

  const hints = [
    // Preconnect to external domains
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    { rel: 'preconnect', href: 'https://api.stripe.com' },

    // DNS prefetch for other domains
    { rel: 'dns-prefetch', href: 'https://www.google-analytics.com' },
    { rel: 'dns-prefetch', href: 'https://connect.facebook.net' },
  ]

  hints.forEach(({ rel, href, crossorigin }) => {
    const link = document.createElement('link')
    link.rel = rel
    link.href = href
    if (crossorigin) link.setAttribute('crossorigin', crossorigin)
    document.head.appendChild(link)
  })
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
    return
  }

  // Estimate bundle size from performance entries
  const entries = performance.getEntriesByType('navigation')
  if (entries.length > 0) {
    const navigation = entries[0] as PerformanceNavigationTiming
    const totalSize = navigation.transferSize || 0

    console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`)

    // Log individual resource sizes
    performance.getEntriesByType('resource').forEach((resource: PerformanceResourceTiming) => {
      if (resource.name.includes('/_next/static/')) {
        const size = resource.transferSize || 0
        if (size > 100 * 1024) { // Log files > 100KB
          console.log(`Large resource: ${resource.name} - ${(size / 1024).toFixed(2)} KB`)
        }
      }
    })
  }
}