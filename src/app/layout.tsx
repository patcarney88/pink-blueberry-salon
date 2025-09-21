import type { Metadata, Viewport } from 'next'
import { Inter, Dancing_Script, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { CartProvider } from '@/contexts/CartContext'
import { LanguageProvider } from '@/lib/language-context'
import AuthSessionProvider from '@/components/providers/SessionProvider'
import CartModal from '@/components/cart/CartModal'
import SkipNav from '@/components/SkipNav'
import PWAInstaller from '@/components/PWAInstaller'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dancing-script',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://pinkblueberrysalon.com'),
  title: {
    default: 'Pink Blueberry Salon - Premium Beauty & Wellness',
    template: '%s | Pink Blueberry Salon'
  },
  description: 'Experience luxury beauty services at Pink Blueberry Salon. Expert hair styling, coloring, nails, and spa treatments in a welcoming atmosphere.',
  keywords: ['salon', 'beauty', 'hair', 'nails', 'spa', 'wellness', 'styling', 'coloring', 'AI beauty advisor'],
  authors: [{ name: 'Pink Blueberry Salon' }],
  creator: 'Pink Blueberry Salon',
  publisher: 'Pink Blueberry Salon',
  manifest: '/manifest.json',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Pink Blueberry Salon - Premium Beauty & Wellness',
    description: 'Experience luxury beauty services at Pink Blueberry Salon.',
    url: 'https://pinkblueberrysalon.com',
    siteName: 'Pink Blueberry Salon',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Pink Blueberry Salon',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pink Blueberry Salon',
    description: 'Experience luxury beauty services at Pink Blueberry Salon.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dancingScript.variable} ${playfairDisplay.variable} font-sans antialiased`}>
        <SkipNav />
        <AuthSessionProvider>
          <LanguageProvider>
            <CartProvider>
              <div id="main-content">
                {children}
              </div>
              <CartModal />
              <PWAInstaller />
              <Analytics />
              <SpeedInsights />
            </CartProvider>
          </LanguageProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}