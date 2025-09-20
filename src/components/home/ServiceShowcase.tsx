'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, Clock, Users, ArrowRight, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Service {
  id: string
  name: string
  description: string
  price: string
  duration: string
  rating: number
  reviews: number
  popular: boolean
  category: string
  image: string
}

const services: Service[] = [
  {
    id: 'highlights',
    name: 'Full Highlights',
    description: 'Transform your look with masterful highlighting techniques using premium color systems.',
    price: '$120',
    duration: '2-3 hours',
    rating: 4.9,
    reviews: 45,
    popular: true,
    category: 'Color',
    image: '🎨'
  },
  {
    id: 'cut-style',
    name: 'Shampoo & Cut',
    description: 'Professional precision cut with consultation, wash, and signature styling.',
    price: '$30',
    duration: '45-60 min',
    rating: 5.0,
    reviews: 62,
    popular: true,
    category: 'Hair',
    image: '✂️'
  },
  {
    id: 'perms',
    name: 'Specialty Perms',
    description: 'Create lasting texture and volume with advanced perm techniques.',
    price: '$100+',
    duration: '2-3 hours',
    rating: 4.8,
    reviews: 28,
    popular: false,
    category: 'Texture',
    image: '💫'
  },
  {
    id: 'color',
    name: 'Single Process Color',
    description: 'Full coverage color treatment with professional-grade products.',
    price: '$75',
    duration: '1.5-2 hours',
    rating: 4.9,
    reviews: 38,
    popular: false,
    category: 'Color',
    image: '🌈'
  },
  {
    id: 'brazilian',
    name: 'Brazilian Blowout',
    description: 'Smooth, frizz-free hair with our keratin treatment.',
    price: '$200+',
    duration: '2-3 hours',
    rating: 5.0,
    reviews: 22,
    popular: false,
    category: 'Treatment',
    image: '✨'
  },
  {
    id: 'extensions',
    name: 'Hair Extensions',
    description: 'Add length and volume with premium quality extensions.',
    price: '$300+',
    duration: '2-4 hours',
    rating: 4.9,
    reviews: 18,
    popular: false,
    category: 'Extensions',
    image: '💁‍♀️'
  }
]

export default function ServiceShowcase() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [hoveredService, setHoveredService] = useState<string | null>(null)

  const categories = ['All', 'Color', 'Hair', 'Texture', 'Treatment', 'Extensions']

  const filteredServices = selectedCategory === 'All'
    ? services
    : services.filter(service => service.category === selectedCategory)

  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-100 to-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-100 to-pink-100 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-light text-gray-900 mb-6">
            Our Signature
            <span className="block text-6xl md:text-7xl bg-gradient-to-r from-pink-600 via-amber-500 to-blue-600 bg-clip-text text-transparent font-bold font-[family-name:var(--font-dancing-script)]">
              Services
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Expertly crafted beauty services with transparent pricing and exceptional results
          </p>
        </motion.div>

        {/* Category Filter - Mobile Optimized */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg'
                  : 'bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Service Cards Grid - Mobile Swipeable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredService(service.id)}
                onMouseLeave={() => setHoveredService(null)}
                className="relative group"
              >
                <div className="relative backdrop-blur-lg bg-white/80 border border-gray-200 rounded-3xl p-8 hover:bg-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                  {/* Popular Badge */}
                  {service.popular && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Popular</span>
                    </div>
                  )}

                  {/* Service Icon with Gold Accent */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-blue-400 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-500">
                      {service.image}
                    </div>
                    {hoveredService === service.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center"
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>

                  {/* Service Details */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.name}</h3>
                  <p className="text-gray-600 mb-6 line-clamp-2">{service.description}</p>

                  {/* Price and Duration */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-light bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                      {service.price}
                    </span>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration}
                    </div>
                  </div>

                  {/* Rating and Reviews */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(service.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">{service.rating}</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Users className="w-4 h-4 mr-1" />
                      {service.reviews} reviews
                    </div>
                  </div>

                  {/* Quick Booking Button */}
                  <Link
                    href={`/booking?service=${service.id}`}
                    className="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white py-3 px-6 rounded-2xl hover:shadow-lg transition-all duration-300 font-semibold text-center block group"
                  >
                    <span className="flex items-center justify-center">
                      Book Now
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* View All Services CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-16"
        >
          <Link
            href="/services"
            className="inline-flex items-center backdrop-blur-md bg-white/60 border-2 border-amber-300/50 text-gray-700 px-10 py-5 rounded-full hover:bg-white/80 hover:border-amber-400 transition-all duration-500 font-semibold text-lg group"
          >
            Explore All Services
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}