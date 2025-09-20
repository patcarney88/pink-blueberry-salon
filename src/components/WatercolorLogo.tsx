'use client'

import React from 'react'

interface WatercolorLogoProps {
  size?: number
  className?: string
}

export default function WatercolorLogo({ size = 100, className = '' }: WatercolorLogoProps) {
  return (
    <div className={`relative group ${className}`} style={{ width: size, height: size }}>
      {/* Glow effect container */}
      <div className="absolute inset-0 scale-150 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 via-purple-400/15 to-blue-400/20 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-1000" />
      </div>

      {/* White background circle for better contrast */}
      <div className="absolute inset-0 bg-white/70 rounded-full backdrop-blur-md shadow-xl" />

      {/* SVG Logo directly embedded for better control */}
      <svg
        viewBox="0 0 800 800"
        width={size}
        height={size}
        className="relative z-10 transform group-hover:scale-110 transition-transform duration-700"
        style={{
          filter: 'drop-shadow(0 10px 20px rgba(236, 72, 153, 0.25)) drop-shadow(0 6px 12px rgba(59, 130, 246, 0.25))'
        }}
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

          {/* Gold gradient for accents */}
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Main blueberry cluster */}
        <g filter="url(#watercolor)">
          {/* Center berry */}
          <ellipse cx="400" cy="320" rx="150" ry="145" fill="url(#blueberryGradient)" opacity="0.9"/>

          {/* Surrounding berries */}
          <ellipse cx="320" cy="280" rx="80" ry="75" fill="url(#blueberryGradient)" opacity="0.8"/>
          <ellipse cx="480" cy="270" rx="70" ry="68" fill="url(#blueberryGradient)" opacity="0.85"/>
          <ellipse cx="360" cy="380" rx="75" ry="72" fill="url(#blueberryGradient)" opacity="0.82"/>
          <ellipse cx="450" cy="370" rx="65" ry="62" fill="url(#blueberryGradient)" opacity="0.88"/>

          {/* Small accent berries */}
          <circle cx="280" cy="350" r="35" fill="url(#blueberryGradient)" opacity="0.75"/>
          <circle cx="520" cy="330" r="30" fill="url(#blueberryGradient)" opacity="0.78"/>
          <circle cx="390" cy="250" r="25" fill="url(#blueberryGradient)" opacity="0.72"/>
        </g>

        {/* Highlight spots for dimension */}
        <ellipse cx="380" cy="290" rx="25" ry="20" fill="white" opacity="0.3" filter="blur(2px)"/>
        <ellipse cx="450" cy="300" rx="18" ry="15" fill="white" opacity="0.25" filter="blur(1.5px)"/>
        <ellipse cx="340" cy="330" rx="15" ry="12" fill="white" opacity="0.28" filter="blur(1px)"/>

        {/* Golden accent sparkles */}
        <g className="group-hover:animate-pulse">
          <circle cx="250" cy="250" r="3" fill="url(#goldGradient)" opacity="0.6"/>
          <circle cx="550" cy="290" r="2.5" fill="url(#goldGradient)" opacity="0.5"/>
          <circle cx="380" cy="420" r="3.5" fill="url(#goldGradient)" opacity="0.55"/>
        </g>
      </svg>

      {/* Shimmer overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-full">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </div>

      {/* Decorative dots */}
      <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110 shadow-lg" />
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full opacity-0 group-hover:opacity-90 transition-all duration-600 transform group-hover:scale-110 shadow-lg" />
      <div className="absolute top-0 -right-3 w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-0 group-hover:opacity-80 transition-all duration-700 transform group-hover:scale-110 shadow-lg" />
    </div>
  )
}