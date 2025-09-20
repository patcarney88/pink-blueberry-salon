'use client'

import Link from 'next/link'
import { ArrowRight, Star, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function EnhancedHero() {
  return (
    <section className="relative z-10 min-h-screen flex items-center overflow-hidden">
      {/* Watercolor Blueberry Background Effect */}
      <div className="absolute inset-0 -z-10">
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <filter id="watercolor">
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="4" result="turbulence" />
              <feColorMatrix in="turbulence" type="saturate" values="2" />
              <feComposite in="turbulence" operator="over" />
            </filter>
            <linearGradient id="blueberryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle
            cx="300" cy="200" r="150"
            fill="url(#blueberryGradient)"
            filter="url(#watercolor)"
            className="animate-pulse"
          />
          <circle
            cx="1600" cy="400" r="200"
            fill="url(#blueberryGradient)"
            filter="url(#watercolor)"
            className="animate-pulse delay-1000"
          />
          <circle
            cx="900" cy="800" r="180"
            fill="url(#blueberryGradient)"
            filter="url(#watercolor)"
            className="animate-pulse delay-2000"
          />
        </svg>
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Trust Indicators Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm md:text-base"
          >
            <div className="flex items-center space-x-2 backdrop-blur-md bg-white/30 px-4 py-2 rounded-full">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="text-gray-700 font-medium">5.0 Rating</span>
            </div>
            <div className="backdrop-blur-md bg-white/30 px-4 py-2 rounded-full text-gray-700 font-medium">
              70+ Happy Clients
            </div>
            <div className="backdrop-blur-md bg-white/30 px-4 py-2 rounded-full text-gray-700 font-medium">
              Award Winning Salon
            </div>
          </motion.div>

          {/* Main Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-center"
          >
            {/* Gold Calligraphy Typography with Shimmer */}
            <h1 className="text-6xl md:text-8xl font-light text-gray-900 mb-6 leading-tight">
              <span className="block">Experience</span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent font-bold font-[family-name:var(--font-dancing-script)] bg-[length:200%_auto] animate-shimmer">
                  Luxury Beauty
                </span>
                <Sparkles className="absolute -top-6 -right-8 w-8 h-8 text-amber-500 animate-pulse" />
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Where artistry meets excellence. Transform your look with our master stylists
              in the heart of Apopka's premier beauty destination.
            </p>

            {/* Mobile-Optimized CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/booking"
                  className="group relative bg-gradient-to-r from-pink-500 to-blue-500 text-white px-10 py-5 rounded-full hover:shadow-2xl transition-all duration-500 inline-flex items-center justify-center font-semibold text-lg w-full sm:w-auto"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-full blur-xl"></span>
                  <span className="relative z-10 flex items-center">
                    Book Your Transformation
                    <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>
              </motion.div>

              <motion.a
                href="tel:4075749525"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group relative backdrop-blur-md bg-white/40 border-2 border-amber-300/50 text-gray-700 px-10 py-5 rounded-full hover:bg-white/60 hover:border-amber-400 transition-all duration-500 font-semibold text-lg inline-flex items-center justify-center w-full sm:w-auto"
              >
                <span className="relative z-10">Call (407) 574-9525</span>
              </motion.a>
            </div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-16 flex flex-col md:flex-row items-center justify-center gap-8"
            >
              <div className="flex -space-x-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-blue-400 border-3 border-white shadow-md flex items-center justify-center text-white font-semibold"
                  >
                    {i === 5 ? '+' : ''}
                  </div>
                ))}
              </div>
              <div className="text-center md:text-left">
                <p className="text-gray-700 font-medium">Join 70+ satisfied clients</p>
                <p className="text-sm text-gray-500">who trust us with their beauty</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}