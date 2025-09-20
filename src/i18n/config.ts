export const locales = ['en', 'es', 'fr'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
}

export const localeCurrencies: Record<Locale, string> = {
  en: 'USD',
  es: 'EUR',
  fr: 'EUR',
}

export const localeTimezones: Record<Locale, string> = {
  en: 'America/New_York',
  es: 'Europe/Madrid',
  fr: 'Europe/Paris',
}