import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/providers'
import { Toaster } from '@/components/ui/toaster'
import { PerformanceMonitor } from '@/components/performance/performance-monitor'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Pink Blueberry Salon - Premium Beauty & Wellness',
    template: '%s | Pink Blueberry Salon'
  },
  description: 'Experience luxury beauty services at Pink Blueberry Salon. Expert hair styling, coloring, nails, and spa treatments in a welcoming atmosphere.',
  keywords: ['salon', 'beauty', 'hair', 'nails', 'spa', 'wellness', 'styling', 'coloring'],
  authors: [{ name: 'Pink Blueberry Salon' }],
  creator: 'Pink Blueberry Salon',
  publisher: 'Pink Blueberry Salon',
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
  maximumScale: 1,
  userScalable: false,
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
          <PerformanceMonitor />
        </Providers>
      </body>
    </html>
  )
}