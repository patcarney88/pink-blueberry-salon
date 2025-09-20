'use client'

import Image from 'next/image'
import { useState, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  className?: string
  onLoad?: () => void
  onError?: () => void
  style?: React.CSSProperties
}

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="20%" />
      <stop stop-color="#edeef1" offset="50%" />
      <stop stop-color="#f6f7f8" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" opacity="0.3" />
  <animate attributeName="opacity" begin="0s" dur="2s" values="0.3;0.7;0.3" repeatCount="indefinite" />
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({
    src,
    alt,
    width = 400,
    height = 300,
    fill = false,
    sizes,
    priority = false,
    quality = 80,
    placeholder = 'blur',
    blurDataURL,
    className,
    onLoad,
    onError,
    style,
    ...props
  }, ref) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    const handleLoad = () => {
      setIsLoading(false)
      onLoad?.()
    }

    const handleError = () => {
      setIsLoading(false)
      setHasError(true)
      onError?.()
    }

    // Generate default blur placeholder if not provided
    const defaultBlurDataURL = blurDataURL ||
      `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`

    if (hasError) {
      return (
        <div
          className={cn(
            'flex items-center justify-center bg-muted text-muted-foreground text-sm',
            fill ? 'absolute inset-0' : '',
            className
          )}
          style={fill ? style : { width, height, ...style }}
        >
          Failed to load image
        </div>
      )
    }

    return (
      <div className={cn('relative overflow-hidden', className)}>
        <Image
          ref={ref}
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          sizes={sizes || (fill ? '100vw' : `${width}px`)}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
          onLoad={handleLoad}
          onError={handleError}
          style={style}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          {...props}
        />

        {isLoading && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-muted animate-pulse',
              fill ? '' : ''
            )}
            style={fill ? {} : { width, height }}
          >
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    )
  }
)

OptimizedImage.displayName = 'OptimizedImage'

// Higher-order component for automatic lazy loading
export function withLazyLoading<T extends { src: string }>(
  Component: React.ComponentType<T>
) {
  return forwardRef<HTMLElement, T>((props, ref) => {
    const [isInView, setIsInView] = useState(false)
    const [imgRef, setImgRef] = useState<HTMLElement | null>(null)

    // Intersection Observer for lazy loading
    React.useEffect(() => {
      if (!imgRef || isInView) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        },
        { threshold: 0.1, rootMargin: '50px' }
      )

      observer.observe(imgRef)
      return () => observer.disconnect()
    }, [imgRef, isInView])

    const combinedRef = (node: HTMLElement | null) => {
      setImgRef(node)
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    return (
      <Component
        {...props}
        ref={combinedRef}
        src={isInView ? props.src : 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='}
      />
    )
  })
}

// Responsive image component with automatic srcSet generation
interface ResponsiveImageProps extends OptimizedImageProps {
  aspectRatio?: number
  breakpoints?: number[]
}

export function ResponsiveImage({
  src,
  aspectRatio = 16 / 9,
  breakpoints = [640, 768, 1024, 1280, 1536],
  sizes: customSizes,
  ...props
}: ResponsiveImageProps) {
  // Generate responsive sizes if not provided
  const sizes = customSizes || breakpoints
    .map((bp, index) => {
      if (index === breakpoints.length - 1) {
        return `${bp}px`
      }
      return `(max-width: ${bp}px) ${bp}px`
    })
    .join(', ')

  return (
    <OptimizedImage
      src={src}
      sizes={sizes}
      {...props}
    />
  )
}

// Preload critical images
export function preloadImage(src: string, options?: { as?: string; type?: string }) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = src
  link.as = options?.as || 'image'
  if (options?.type) link.type = options.type

  document.head.appendChild(link)
}