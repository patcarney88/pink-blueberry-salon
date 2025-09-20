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
    sm: { width: 50, height: 50, fontSize: 'text-xl', letterSpacing: '0.2em' },
    md: { width: 70, height: 70, fontSize: 'text-3xl', letterSpacing: '0.25em' },
    lg: { width: 100, height: 100, fontSize: 'text-4xl', letterSpacing: '0.3em' },
    xl: { width: 140, height: 140, fontSize: 'text-5xl', letterSpacing: '0.35em' }
  }

  const { width, height, fontSize, letterSpacing } = dimensions[size]

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Use actual logo image */}
      <div className="relative group" style={{ width, height }}>
        {/* Luxury glow effect behind logo */}
        <div className="absolute inset-0 scale-125">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-300/30 via-purple-300/30 to-blue-300/30 rounded-full blur-2xl animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/20 to-transparent rounded-full blur-xl animate-pulse delay-1000" />
        </div>

        {/* Actual logo image with luxury effects */}
        <div className="relative w-full h-full">
          <Image
            src="/logo.svg"
            alt="The Pink Blueberry"
            width={width}
            height={height}
            className="relative z-10 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
            priority
          />

          {/* Luxury overlay effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/5 to-white/10 rounded-full pointer-events-none" />

          {/* Shimmer effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
          </div>
        </div>

        {/* Floating sparkles around logo */}
        <div className="absolute -inset-4 pointer-events-none">
          <div className="absolute top-0 left-1/2 w-1 h-1 bg-amber-400 rounded-full animate-float-sparkle" />
          <div className="absolute bottom-0 right-1/3 w-1 h-1 bg-amber-500 rounded-full animate-float-sparkle delay-1000" />
          <div className="absolute top-1/2 right-0 w-1 h-1 bg-amber-400 rounded-full animate-float-sparkle delay-2000" />
        </div>
      </div>

      {/* Luxury Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          {/* Main text with premium styling */}
          <div className="relative">
            <span
              className={`font-playfair ${fontSize} bg-gradient-to-r from-rose-600 via-pink-500 to-purple-600 bg-clip-text text-transparent font-black tracking-tight`}
              style={{
                textShadow: '0 4px 30px rgba(236, 72, 153, 0.3)',
                letterSpacing: '-0.02em'
              }}
            >
              The Pink
            </span>
          </div>
          <div className="relative -mt-2">
            <span
              className={`font-playfair ${fontSize} bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent font-black tracking-tight`}
              style={{
                textShadow: '0 4px 30px rgba(79, 70, 229, 0.3)',
                letterSpacing: '-0.02em'
              }}
            >
              Blueberry
            </span>
          </div>

          {/* Luxury tagline with gold accents */}
          {size !== 'sm' && (
            <div className="mt-3 ml-1 flex items-center">
              <span
                className="text-xs font-light bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent tracking-[0.4em] uppercase"
                style={{ letterSpacing }}
              >
                Luxury
              </span>
              <span className="mx-2 text-amber-500">•</span>
              <span
                className="text-xs font-light bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent tracking-[0.4em] uppercase"
                style={{ letterSpacing }}
              >
                Beauty
              </span>
              <span className="mx-2 text-amber-500">•</span>
              <span
                className="text-xs font-light bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent tracking-[0.4em] uppercase"
                style={{ letterSpacing }}
              >
                Experience
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}