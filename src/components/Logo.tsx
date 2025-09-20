'use client'

import React from 'react'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
  variant?: 'default' | 'luxury' | 'minimal'
}

export default function Logo({ size = 'md', showText = true, className = '', variant = 'luxury' }: LogoProps) {
  const dimensions = {
    sm: { width: 60, height: 60, fontSize: 'text-base', letterSpacing: '0.05em' },
    md: { width: 80, height: 80, fontSize: 'text-xl', letterSpacing: '0.05em' },
    lg: { width: 100, height: 100, fontSize: 'text-2xl', letterSpacing: '0.06em' },
    xl: { width: 140, height: 140, fontSize: 'text-3xl', letterSpacing: '0.07em' }
  }

  const { width, height, fontSize, letterSpacing } = dimensions[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Watercolor Logo with enhanced effects */}
      <div className="relative group" style={{ width, height }}>
        {/* Ambient glow effect */}
        <div className="absolute inset-0 scale-150">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-300/30 via-purple-300/20 to-blue-300/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
        </div>

        {/* Logo container with enhanced styling */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Background circle for contrast */}
          <div className="absolute inset-0 bg-white/50 rounded-full backdrop-blur-sm" />

          {/* Actual watercolor logo */}
          <Image
            src="/logo.svg"
            alt="The Pink Blueberry"
            width={width}
            height={height}
            className="relative z-10 object-contain transform group-hover:scale-110 transition-all duration-700 ease-out"
            priority
            style={{
              filter: 'drop-shadow(0 8px 16px rgba(236, 72, 153, 0.2)) drop-shadow(0 4px 8px rgba(59, 130, 246, 0.2))',
              maxWidth: '100%',
              height: 'auto'
            }}
          />

          {/* Premium shimmer overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 via-transparent to-blue-400/10 group-hover:animate-pulse" />
          </div>
        </div>

        {/* Decorative accent dots */}
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full opacity-0 group-hover:opacity-90 transition-all duration-500 group-hover:scale-125 shadow-lg" />
        <div className="absolute -top-2 -left-2 w-3 h-3 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full opacity-0 group-hover:opacity-80 transition-all duration-700 group-hover:scale-125 shadow-lg" />
        <div className="absolute -top-1 -right-3 w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-0 group-hover:opacity-70 transition-all duration-900 group-hover:scale-125 shadow-lg" />
      </div>

      {/* Luxury Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          {/* Main text with premium styling */}
          <div className="relative">
            <span
              className={`font-playfair ${fontSize} bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent font-light tracking-wide`}
              style={{
                letterSpacing: letterSpacing,
                fontSize: size === 'lg' ? '1.5rem' : size === 'xl' ? '2rem' : '1.25rem'
              }}
            >
              The Pink
            </span>
          </div>
          <div className="relative -mt-1">
            <span
              className={`font-playfair ${fontSize} font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent group-hover:from-pink-600 group-hover:via-purple-600 group-hover:to-blue-600 transition-all duration-500`}
              style={{
                letterSpacing: letterSpacing,
                fontSize: size === 'lg' ? '1.75rem' : size === 'xl' ? '2.25rem' : '1.5rem'
              }}
            >
              Blueberry
            </span>
          </div>

          {/* Elegant tagline with gold accent */}
          {size !== 'sm' && (
            <div className="mt-2 ml-1">
              <span
                className="text-xs font-light bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent uppercase tracking-widest opacity-90"
                style={{ letterSpacing: '0.3em' }}
              >
                Luxury Salon & Spa
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}