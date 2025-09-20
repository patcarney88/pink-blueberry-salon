'use client'

import React from 'react'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const dimensions = {
    sm: { width: 40, height: 40, fontSize: 'text-lg' },
    md: { width: 60, height: 60, fontSize: 'text-2xl' },
    lg: { width: 80, height: 80, fontSize: 'text-3xl' },
    xl: { width: 120, height: 120, fontSize: 'text-4xl' }
  }

  const { width, height, fontSize } = dimensions[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Watercolor Blueberry Logo */}
      <div className="relative" style={{ width, height }}>
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200/30 to-blue-200/30 rounded-full blur-xl animate-pulse" />

        {/* SVG Logo */}
        <svg
          viewBox="0 0 800 800"
          className="relative w-full h-full drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Watercolor texture filters */}
            <filter id="watercolor" x="-50%" y="-50%" width="200%" height="200%">
              <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="turbulence" seed="1"/>
              <feColorMatrix in="turbulence" type="saturate" values="0" result="desat"/>
              <feComponentTransfer in="desat" result="discrete">
                <feFuncA type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1"/>
              </feComponentTransfer>
              <feGaussianBlur in="discrete" stdDeviation="0.5" result="blur"/>
              <feComposite operator="over" in="blur" in2="SourceGraphic"/>
            </filter>

            {/* Pink to blue gradient */}
            <radialGradient id="blueberryGradient" cx="45%" cy="45%">
              <stop offset="0%" style={{ stopColor: '#fce7f3', stopOpacity: 0.8 }} />
              <stop offset="30%" style={{ stopColor: '#f9a8d4', stopOpacity: 0.9 }} />
              <stop offset="60%" style={{ stopColor: '#60a5fa', stopOpacity: 0.95 }} />
              <stop offset="100%" style={{ stopColor: '#1e40af', stopOpacity: 1 }} />
            </radialGradient>

            {/* Gold gradient */}
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Main blueberry shape with watercolor effect */}
          <g filter="url(#watercolor)">
            {/* Base blueberry circle */}
            <ellipse cx="400" cy="400" rx="200" ry="195" fill="url(#blueberryGradient)" opacity="0.85"/>

            {/* Watercolor splashes */}
            <ellipse cx="380" cy="380" rx="185" ry="180" fill="#ec4899" opacity="0.25" transform="rotate(-15 380 380)"/>
            <ellipse cx="420" cy="420" rx="175" ry="170" fill="#3b82f6" opacity="0.3" transform="rotate(20 420 420)"/>

            {/* Blueberry crown/calyx */}
            <path d="M 360 280 Q 400 260 440 280 L 430 310 L 400 300 L 370 310 Z" fill="#1e40af" opacity="0.7"/>

            {/* Highlight spots for dimension */}
            <ellipse cx="350" cy="360" rx="35" ry="40" fill="rgba(255,255,255,0.4)" transform="rotate(-20 350 360)"/>
            <ellipse cx="450" cy="390" rx="25" ry="30" fill="rgba(255,255,255,0.3)" transform="rotate(30 450 390)"/>
            <ellipse cx="390" cy="450" rx="28" ry="33" fill="rgba(147,197,253,0.4)" transform="rotate(-10 390 450)"/>
          </g>

          {/* Gold sparkles */}
          <g opacity="0.8">
            <circle cx="250" cy="250" r="4" fill="#f59e0b">
              <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="550" cy="320" r="3" fill="#fbbf24">
              <animate attributeName="opacity" values="0;1;0" dur="3s" begin="0.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="500" cy="500" r="4" fill="#f59e0b">
              <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="300" cy="480" r="3" fill="#fbbf24">
              <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1.5s" repeatCount="indefinite"/>
            </circle>
          </g>
        </svg>
      </div>

      {/* Text Logo */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={`font-dancing-script ${fontSize} bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent font-bold`}
            style={{ textShadow: '0 2px 4px rgba(245, 158, 11, 0.1)' }}
          >
            The Pink
          </span>
          <span
            className={`font-dancing-script ${fontSize} bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent font-bold -mt-1`}
            style={{ textShadow: '0 2px 4px rgba(245, 158, 11, 0.1)' }}
          >
            Blueberry
          </span>
          {size !== 'sm' && (
            <span className="text-xs tracking-[0.3em] text-amber-600 font-medium ml-1 mt-1">
              SALON
            </span>
          )}
        </div>
      )}
    </div>
  )
}