'use client'

import { useState, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import soundManager from '@/lib/sound-manager'

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    setEnabled(soundManager.isEnabled())
  }, [])

  const toggleSound = () => {
    const newState = !enabled
    setEnabled(newState)
    soundManager.setEnabled(newState)
    
    // Play a feedback sound when enabling
    if (newState) {
      soundManager.playSound('click')
    }
  }

  return (
    <button
      onClick={toggleSound}
      className="relative p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300 group"
      aria-label="Toggle sound effects"
    >
      <div className="relative w-5 h-5">
        <Volume2
          className={`absolute inset-0 w-5 h-5 text-purple-600 transition-all duration-300 ${
            enabled ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        />
        <VolumeX
          className={`absolute inset-0 w-5 h-5 text-gray-500 transition-all duration-300 ${
            enabled ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
          }`}
        />
      </div>
      
      {/* Animated background pulse when enabled */}
      {enabled && (
        <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping" />
      )}
    </button>
  )
}