'use client'

import React from 'react'
import Image from 'next/image'

interface LogoLuxuryProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
  variant?: 'default' | 'minimal' | 'premium'
  responsive?: boolean
}

export default function LogoLuxury({
  size = 'md',
  showText = true,
  className = '',
  variant = 'premium',
  responsive = true
}: LogoLuxuryProps) {

  // Refined dimensions for better visual balance
  const dimensions = {
    sm: {
      width: 36,
      height: 36,
      primarySize: 'text-sm',
      secondarySize: 'text-lg',
      taglineSize: 'text-[10px]',
      gap: 'gap-2'
    },
    md: {
      width: 48,
      height: 48,
      primarySize: 'text-base',
      secondarySize: 'text-2xl',
      taglineSize: 'text-xs',
      gap: 'gap-3'
    },
    lg: {
      width: 64,
      height: 64,
      primarySize: 'text-lg',
      secondarySize: 'text-3xl',
      taglineSize: 'text-xs',
      gap: 'gap-4'
    },
    xl: {
      width: 80,
      height: 80,
      primarySize: 'text-xl',
      secondarySize: 'text-4xl',
      taglineSize: 'text-sm',
      gap: 'gap-5'
    }
  }

  const { width, height, primarySize, secondarySize, taglineSize, gap } = dimensions[size]

  // Premium variant with refined aesthetics
  if (variant === 'premium') {
    return (
      <div className={`flex items-center ${gap} ${className} ${responsive ? 'scale-90 sm:scale-100' : ''}`}>
        {/* Logo mark with elegant effects */}
        <div className="relative group">
          {/* Soft luxury glow - only on hover */}
          <div
            className="absolute inset-0 scale-110 opacity-0 group-hover:opacity-100 transition-all duration-700"
            style={{ width, height }}
          >
            <div className="absolute inset-0 bg-gradient-radial from-pink-200/30 via-transparent to-transparent rounded-full blur-md" />
          </div>

          {/* Logo image */}
          <div className="relative" style={{ width, height }}>
            <Image
              src="/logo-clean.svg"
              alt="The Pink Blueberry"
              width={width}
              height={height}
              className="relative z-10 drop-shadow-sm group-hover:drop-shadow-md group-hover:scale-105 transition-all duration-500 ease-out"
              priority
            />

            {/* Premium shimmer overlay - subtle and only on hover */}
            <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 group-hover:animate-shimmer" />
              </div>
            </div>
          </div>
        </div>

        {/* Elegant typography */}
        {showText && (
          <div className="flex flex-col justify-center -space-y-1">
            {/* Brand name with refined styling */}
            <div className="flex flex-col">
              <span className={`font-playfair ${primarySize} text-gray-700 font-light tracking-[0.08em] uppercase`}>
                The Pink
              </span>
              <span className={`font-playfair ${secondarySize} font-semibold -mt-1 bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent`}>
                Blueberry
              </span>
            </div>

            {/* Subtle tagline */}
            {size !== 'sm' && (
              <div className="mt-1.5">
                <span className={`${taglineSize} text-amber-700/70 font-light tracking-[0.25em] uppercase`}>
                  Luxury Salon
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Minimal variant for smaller contexts
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center ${gap} ${className}`}>
        <Image
          src="/logo-clean.svg"
          alt="The Pink Blueberry"
          width={width}
          height={height}
          className="drop-shadow-sm hover:drop-shadow-md transition-all duration-300"
          priority
        />
        {showText && (
          <span className={`font-playfair ${secondarySize} font-medium bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent`}>
            PB
          </span>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <Image
        src="/logo-clean.svg"
        alt="The Pink Blueberry"
        width={width}
        height={height}
        className="drop-shadow-md"
        priority
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`font-playfair ${secondarySize} font-bold text-gray-800`}>
            The Pink Blueberry
          </span>
          {size !== 'sm' && (
            <span className={`${taglineSize} text-gray-600 tracking-widest uppercase`}>
              Salon & Spa
            </span>
          )}
        </div>
      )}
    </div>
  )
}