'use client'

import React from 'react'
import WatercolorLogo from './WatercolorLogo'

interface PremiumLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function PremiumLogo({ size = 'md', showText = true, className = '' }: PremiumLogoProps) {
  const sizeMap = {
    sm: 60,
    md: 80,
    lg: 100,
    xl: 140
  }

  const textSizes = {
    sm: { title: 'text-xl', subtitle: 'text-2xl', tagline: 'text-[10px]' },
    md: { title: 'text-2xl', subtitle: 'text-3xl', tagline: 'text-xs' },
    lg: { title: 'text-3xl', subtitle: 'text-4xl', tagline: 'text-sm' },
    xl: { title: 'text-4xl', subtitle: 'text-5xl', tagline: 'text-base' }
  }

  const logoSize = sizeMap[size]
  const { title, subtitle, tagline } = textSizes[size]

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Watercolor Logo */}
      <WatercolorLogo size={logoSize} />

      {/* Premium Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          {/* The Pink - Elegant serif */}
          <div className="relative">
            <span
              className={`font-playfair ${title} font-light tracking-wide bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent`}
            >
              The Pink
            </span>
          </div>

          {/* Blueberry - Bold gradient */}
          <div className="relative -mt-1">
            <span
              className={`font-playfair ${subtitle} font-bold italic bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent`}
              style={{
                textShadow: '0 2px 10px rgba(236, 72, 153, 0.15)'
              }}
            >
              Blueberry
            </span>
          </div>

          {/* Tagline with gold accent */}
          {size !== 'sm' && (
            <div className="mt-2 ml-0.5">
              <span
                className={`${tagline} font-light uppercase tracking-[0.3em] bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent opacity-90`}
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