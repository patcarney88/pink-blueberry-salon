'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show install banner after 30 seconds
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallBanner(true)
        }
      }, 30000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      console.log('PWA installed successfully')
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`)

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }

  if (isInstalled || !showInstallBanner) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white rounded-lg shadow-2xl p-4 border border-gray-200 z-40 animate-slide-up">
      <button
        onClick={() => setShowInstallBanner(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Download className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Install Pink BlueBerry App
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Install our app for quick access, offline support, and appointment notifications!
          </p>

          <div className="flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-pink-500 to-blue-500 text-white text-xs font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
            >
              Install Now
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="flex-1 bg-gray-100 text-gray-700 text-xs font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>

      {/* iOS Install Instructions */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-500 text-center">
          iOS: Tap Share <span className="inline-block rotate-180">↑</span> then "Add to Home Screen"
        </p>
      </div>
    </div>
  )
}