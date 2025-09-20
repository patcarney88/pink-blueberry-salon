import { getRequestConfig } from 'next-intl/server'
import { type Locale, locales } from './config'

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate that the incoming locale is valid
  const locale = (await requestLocale) as Locale

  if (!locales.includes(locale)) {
    // notFound()
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})