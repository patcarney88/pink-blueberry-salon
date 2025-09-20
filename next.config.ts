import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  experimental: {
    // Enable experimental features if needed
  },
  images: {
    domains: ['localhost', 'pinkblueberrysalon.com'],
  },
  // Ensure Turbopack is enabled (already in package.json scripts)
}

export default withNextIntl(nextConfig)
