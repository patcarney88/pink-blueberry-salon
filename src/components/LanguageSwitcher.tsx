'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ]

  const switchLanguage = (langCode: string) => {
    setLanguage(langCode as 'en' | 'es')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 hover:bg-white transition-all duration-300"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {languages.find(l => l.code === language)?.flag} {languages.find(l => l.code === language)?.name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className={`flex items-center gap-3 w-full px-4 py-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-blue-50 transition-colors ${
                language === lang.code ? 'bg-gradient-to-r from-pink-50 to-blue-50' : ''
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm font-medium text-gray-700">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}