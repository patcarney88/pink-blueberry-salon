'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Sparkles, Star, Heart, Crown, Diamond } from 'lucide-react'

export default function LuxuryHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]" />
      </div>

      {/* Animated luxury pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='a' patternUnits='userSpaceOnUse' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='2' fill='%23ec4899' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23a)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Premium badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-full border border-amber-300/30 shadow-lg backdrop-blur-sm">
              <Crown className="w-5 h-5 text-amber-600" />
              <span className="text-amber-800 font-semibold tracking-wide text-sm">LUXURY SALON EXPERIENCE</span>
              <Diamond className="w-5 h-5 text-amber-600" />
            </div>
          </motion.div>

          {/* Main headline with elegant animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-gray-900 mb-6 leading-[0.9]">
              <span className="block mb-2">Where Beauty</span>
              <span className="block relative">
                <span className="relative z-10 font-playfair font-bold italic bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Meets Perfection
                </span>
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-8 -right-8 sm:-top-10 sm:-right-10"
                >
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
                </motion.div>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light"
            >
              Immerse yourself in the ultimate luxury beauty experience.
              <span className="block mt-2 text-base sm:text-lg md:text-xl text-gray-500">
                Master stylists • Premium treatments • Unforgettable transformations
              </span>
            </motion.p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {[
              { icon: '✨', text: 'AI Beauty Advisor' },
              { icon: '📸', text: 'AR Virtual Try-On' },
              { icon: '🏆', text: 'VIP Rewards' },
              { icon: '💎', text: 'Luxury Service' },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <span className="text-base font-medium text-gray-700">
                  <span className="mr-2">{item.icon}</span>
                  {item.text}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Elegant CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-blue-600 rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
              <Link
                href="/booking"
                className="relative bg-gradient-to-r from-pink-600 to-blue-600 text-white px-10 py-5 rounded-full inline-flex items-center justify-center font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Book Your Experience
                <motion.span
                  className="ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>

            <motion.a
              href="tel:4075749525"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group bg-white/90 backdrop-blur-sm border-2 border-gray-200 text-gray-700 px-10 py-5 rounded-full font-semibold text-lg inline-flex items-center justify-center hover:border-pink-300 hover:bg-pink-50/50 transition-all duration-300 shadow-lg"
            >
              <span className="mr-2">📞</span>
              <span>(407) 574-9525</span>
            </motion.a>
          </motion.div>

          {/* Trust indicators with luxury styling */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 border-2 border-white shadow-md flex items-center justify-center"
                  >
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold">
                  70+
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Happy Clients</p>
                <p className="text-xs text-gray-500">Join our beauty family</p>
              </div>
            </div>

            <div className="h-12 w-px bg-gray-300 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">5.0 Rating</p>
                <p className="text-xs text-gray-500">Award-winning service</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-pink-200 to-pink-300 rounded-full blur-2xl opacity-30 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full blur-2xl opacity-30 animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-20 w-16 h-16 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full blur-2xl opacity-30 animate-pulse delay-2000" />
    </section>
  )
}