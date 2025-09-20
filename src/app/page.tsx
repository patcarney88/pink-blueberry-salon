'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'
import EnhancedHero from '@/components/home/EnhancedHero'
import ServiceShowcase from '@/components/home/ServiceShowcase'
import OrganicSoapSection from '@/components/home/OrganicSoapSection'
import ContactHours from '@/components/home/ContactHours'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Enhanced Animated Watercolor Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-blue-50"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-15">
          <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-gradient-to-br from-pink-200 via-pink-100 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-[400px] h-[400px] bg-gradient-to-br from-blue-200 via-blue-100 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-[350px] h-[350px] bg-gradient-to-br from-amber-200 via-amber-100 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-pink-100 via-blue-100 to-amber-100 rounded-full blur-3xl opacity-30 animate-pulse delay-3000"></div>
        </div>
        {/* Floating watercolor spots */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-32 left-1/4 w-32 h-32 bg-pink-300 rounded-full blur-2xl animate-float"></div>
          <div className="absolute top-96 right-1/4 w-24 h-24 bg-blue-300 rounded-full blur-2xl animate-float delay-1000"></div>
          <div className="absolute bottom-32 left-1/2 w-28 h-28 bg-amber-300 rounded-full blur-2xl animate-float delay-2000"></div>
        </div>
      </div>


      {/* Header */}
      <header className="relative z-10 backdrop-blur-md bg-white/80 border-b border-white/20 sticky top-0">
        <div className="container mx-auto px-6 py-6">
          <nav className="flex items-center justify-between">
            {/* Luxury Watercolor Blueberry Logo */}
            <Logo size="lg" showText={true} className="group" />

            {/* Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              <Link href="#services" className="text-gray-700 hover:text-pink-600 transition-all duration-300 font-medium text-lg tracking-wide relative group">
                Services
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#about" className="text-gray-700 hover:text-pink-600 transition-all duration-300 font-medium text-lg tracking-wide relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#contact" className="text-gray-700 hover:text-pink-600 transition-all duration-300 font-medium text-lg tracking-wide relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/booking"
                className="relative bg-gradient-to-r from-pink-500 to-blue-500 text-white px-8 py-4 rounded-3xl hover:shadow-2xl hover:shadow-amber-200 transition-all duration-300 font-semibold text-lg tracking-wide group overflow-hidden"
              >
                <span className="relative z-10">Book Now</span>
                {/* Gold glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-3xl"></div>
                {/* Shimmer effect */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-full transition-all duration-700 transform skew-x-12"></div>
              </Link>
            </div>
          </nav>
        </div>
      </header>


      {/* Enhanced Hero Section */}
      <EnhancedHero />

      {/* Service Showcase Section */}
      <ServiceShowcase />

      {/* Organic Soap Section */}
      <OrganicSoapSection />

      {/* About Section */}
      <section id="about" className="relative z-10 bg-gradient-to-br from-pink-50 to-blue-50 py-20">
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
            <Logo size="md" showText={true} className="brightness-125" />
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
    </div>
  )
}