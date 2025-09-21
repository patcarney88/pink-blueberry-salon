'use client'

import { useTheme } from '@/lib/theme-context'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300 group"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6">
        <Sun
          className={`absolute inset-0 w-6 h-6 text-yellow-500 transition-all duration-300 ${
            isDarkMode ? 'opacity-0 rotate-180 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-6 h-6 text-purple-600 transition-all duration-300 ${
            isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-50'
          }`}
        />
      </div>
      
      {/* Animated background glow */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 ${
          isDarkMode
            ? 'bg-purple-400/20 group-hover:bg-purple-400/30'
            : 'bg-yellow-400/20 group-hover:bg-yellow-400/30'
        } blur-xl -z-10`}
      />
    </button>
  )
}