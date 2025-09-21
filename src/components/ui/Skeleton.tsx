import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  animation?: 'pulse' | 'wave' | 'shimmer'
}

export default function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'shimmer',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-200',
        {
          'rounded-md': variant === 'text',
          'rounded-full': variant === 'circular',
          'rounded-lg': variant === 'rectangular',
          'rounded-xl': variant === 'card',
        },
        {
          'animate-pulse': animation === 'pulse',
        },
        className
      )}
      {...props}
    >
      {animation === 'shimmer' && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      )}
      {animation === 'wave' && (
        <div className="absolute inset-0 -translate-x-full animate-wave bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      )}
    </div>
  )
}

export function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <Skeleton className="h-48 w-full mb-4" variant="rectangular" />
      <Skeleton className="h-6 w-3/4 mb-2" variant="text" />
      <Skeleton className="h-4 w-full mb-1" variant="text" />
      <Skeleton className="h-4 w-5/6 mb-4" variant="text" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-20" variant="text" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <Skeleton className="h-64 w-full" variant="rectangular" />
      <div className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" variant="text" />
        <Skeleton className="h-4 w-full mb-4" variant="text" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-20" variant="text" />
          <Skeleton className="h-10 w-10 rounded-full" variant="circular" />
        </div>
      </div>
    </div>
  )
}

export function TestimonialSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center mb-4">
        <Skeleton className="h-12 w-12 mr-3" variant="circular" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-1" variant="text" />
          <Skeleton className="h-4 w-24" variant="text" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-1" variant="text" />
      <Skeleton className="h-4 w-full mb-1" variant="text" />
      <Skeleton className="h-4 w-3/4" variant="text" />
    </div>
  )
}