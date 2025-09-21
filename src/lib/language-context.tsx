'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

type Language = 'en' | 'es'
type Translations = typeof en

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [translations, setTranslations] = useState<Translations>(en)

  useEffect(() => {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('preferred-language') as Language
    if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
      setLanguageState(savedLang)
      setTranslations(savedLang === 'es' ? es : en)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    setTranslations(lang === 'es' ? es : en)
    localStorage.setItem('preferred-language', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}