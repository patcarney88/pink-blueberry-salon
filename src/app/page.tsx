'use client'

import Link from 'next/link'
import PremiumLogo from '@/components/PremiumLogo'
import LuxuryHero from '@/components/home/LuxuryHero'
import ServiceShowcase from '@/components/home/ServiceShowcase'
import OrganicSoapSection from '@/components/home/OrganicSoapSection'
import ContactHours from '@/components/home/ContactHours'
import FloatingElements from '@/components/home/FloatingElements'
import ParticleEffect from '@/components/ui/ParticleEffect'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import CartIcon from '@/components/cart/CartIcon'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useLanguage } from '@/lib/language-context'
import BeautyAdvisor from '@/components/ai/BeautyAdvisor'
import TestimonialsCarousel from '@/components/home/TestimonialsCarousel'
import AnimatedStats from '@/components/home/AnimatedStats'

export default function HomePage() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/20 to-blue-50/20 dark:from-gray-900 dark:via-purple-950/20 dark:to-blue-950/20 overflow-hidden transition-colors duration-300">
      {/* Particle Effects for Premium Feel */}
      <ParticleEffect />

      {/* Floating Elements Background */}
      <FloatingElements />

      {/* Premium Gradient Background */}
      <div className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-white to-blue-50/50 dark:from-purple-950/30 dark:via-gray-900 dark:to-blue-950/30 transition-colors duration-300"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' patternUnits='userSpaceOnUse' width='100' height='100'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23f0f0f0' stroke-width='0.5' opacity='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
      </div>


      {/* Premium Header with Glass Morphism */}
      <header className="z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/20 dark:border-gray-700/20 shadow-sm sticky top-0 transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-50/10 via-transparent to-blue-50/10"></div>
        <div className="container mx-auto px-6 py-5 relative">
          <nav className="flex items-center justify-between">
            {/* Premium Watercolor Logo */}
            <PremiumLogo size="lg" showText={true} className="group transform hover:scale-105 transition-transform duration-300" />

            {/* Premium Navigation */}
            <div className="hidden md:flex items-center space-x-8 lg:space-x-12">
              <Link href="#services" className="text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 font-medium text-base lg:text-lg tracking-wide relative group">
                <span className="relative z-10">{t.nav.services}</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 group-hover:w-full transition-all duration-500"></span>
              </Link>
              <Link href="/shop" className="text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 font-medium text-base lg:text-lg tracking-wide relative group">
                <span className="relative z-10">{t.nav.shop}</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 group-hover:w-full transition-all duration-500"></span>
              </Link>
              <Link href="#about" className="text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 font-medium text-base lg:text-lg tracking-wide relative group">
                <span className="relative z-10">{t.nav.about}</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 group-hover:w-full transition-all duration-500"></span>
              </Link>
              <Link href="#contact" className="text-gray-700 dark:text-gray-200 hover:text-pink-600 dark:hover:text-pink-400 transition-all duration-300 font-medium text-base lg:text-lg tracking-wide relative group">
                <span className="relative z-10">{t.nav.contact}</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 group-hover:w-full transition-all duration-500"></span>
              </Link>
              <CartIcon />
              <LanguageSwitcher />
              <ThemeToggle />
              <Link
                href="/booking"
                className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-full hover:shadow-2xl hover:shadow-purple-300/30 transition-all duration-500 font-semibold text-base lg:text-lg tracking-wide group overflow-hidden transform hover:scale-105"
              >
                <span className="relative z-10 flex items-center">
                  ✨ {t.nav.bookNow}
                </span>
                {/* Premium shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-all duration-1000 rounded-full"></div>
              </Link>
            </div>
          </nav>
        </div>
      </header>


      {/* Luxury Hero Section */}
      <LuxuryHero />

      {/* Service Showcase Section */}
      <ServiceShowcase />

      {/* Organic Soap Section */}
      <OrganicSoapSection />

      {/* Animated Statistics */}
      <AnimatedStats />

      {/* Testimonials Carousel */}
      <TestimonialsCarousel />

      {/* Premium About Section */}
      <section id="about" className="relative z-10 bg-gradient-to-br from-white via-pink-50/30 to-blue-50/30 py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-5xl font-bold text-gray-900 mb-8">The Pink Blueberry Experience</h3>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Step into our world of luxury and sophistication. Our salon combines the finest beauty techniques 
              with an atmosphere of elegance and relaxation. Every detail is crafted to provide you with an 
              exceptional experience that leaves you feeling beautiful, confident, and refreshed.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌟</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Premium Products</h4>
                <p className="text-gray-600">Only the finest, professional-grade products</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👩‍🎨</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Expert Stylists</h4>
                <p className="text-gray-600">Highly trained professionals with years of experience</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💎</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Luxury Atmosphere</h4>
                <p className="text-gray-600">Sophisticated, relaxing environment designed for comfort</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Hours Section */}
      <ContactHours />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <PremiumLogo size="md" showText={true} className="brightness-110" />
          </div>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Luxury beauty salon dedicated to providing exceptional service and creating beautiful, confident clients.
          </p>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-500">
              © 2024 The Pink Blueberry. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* AI Beauty Advisor */}
      <BeautyAdvisor />
    </div>
  )
}