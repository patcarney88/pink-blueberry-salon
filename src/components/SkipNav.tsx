'use client'

export default function SkipNav() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-pink-600 text-white px-4 py-2 rounded-lg z-50 font-medium"
    >
      Skip to main content
    </a>
  )
}