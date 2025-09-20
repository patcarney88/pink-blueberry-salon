'use client'

import { useState } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { Service } from '@/types/booking'
import { Clock, Star, Check } from 'lucide-react'

// Mock service data with images
const services: Service[] = [
  {
    id: 'shampoo-cut',
    name: 'Shampoo & Cut',
    description: 'Professional hair cutting and styling with premium products. Includes consultation, wash, precision cut, and signature styling.',
    price: 30,
    duration: 60,
    category: 'Hair Cutting',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop'
  },
  {
    id: 'full-highlights',
    name: 'Full Highlights',
    description: 'Transform your look with masterful highlighting techniques using premium color systems for stunning, natural-looking results.',
    price: 120,
    duration: 150,
    category: 'Color Services',
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=300&fit=crop'
  },
  {
    id: 'specialty-perms',
    name: 'Specialty Perms',
    description: 'Create lasting texture and volume with advanced perm techniques, customized to your hair type and desired style goals.',
    price: 100,
    duration: 180,
    category: 'Hair Treatments',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop'
  },
  {
    id: 'balayage',
    name: 'Balayage',
    description: 'Hand-painted highlights for natural-looking dimension and movement. Our artists create customized color that grows out beautifully.',
    price: 180,
    duration: 180,
    category: 'Color Services',
    image: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&h=300&fit=crop'
  },
  {
    id: 'keratin-treatment',
    name: 'Keratin Treatment',
    description: 'Reduce frizz and smooth texture for months with our professional keratin smoothing treatment for all hair types.',
    price: 200,
    duration: 180,
    category: 'Hair Treatments',
    image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=300&fit=crop'
  },
  {
    id: 'bridal-styling',
    name: 'Bridal Styling',
    description: 'Elegant updo or special occasion styling for your perfect day. Includes trial session and wedding day styling.',
    price: 150,
    duration: 120,
    category: 'Special Events',
    image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&h=300&fit=crop'
  }
]

export default function ServiceSelection() {
  const { state, setService, nextStep } = useBooking()
  const [selectedService, setSelectedService] = useState<Service | null>(state.bookingData.service || null)

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setService(service)
  }

  const handleContinue = () => {
    if (selectedService) {
      nextStep()
    }
  }

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-light text-gray-900 mb-4">Choose Your Service</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Select from our signature services, each crafted with precision and care by our expert stylists.
        </p>
      </div>

      <div className="space-y-12">
        {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
          <div key={category}>
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b border-gray-200 pb-2">
              {category}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryServices.map((service) => {
                const isSelected = selectedService?.id === service.id

                return (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`
                      group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden
                      ${isSelected
                        ? 'ring-2 ring-pink-500 shadow-pink-200 transform scale-105'
                        : 'hover:transform hover:scale-102'
                      }
                    `}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleServiceSelect(service)
                      }
                    }}
                    aria-pressed={isSelected}
                    aria-label={`Select ${service.name} service`}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 z-10 w-8 h-8 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}

                    {/* Service Image */}
                    <div className="relative h-48 bg-gradient-to-br from-pink-100 to-blue-100 overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>

                    {/* Service Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-xl font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                          {service.name}
                        </h4>
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                            ${service.price}
                          </div>
                          <div className="flex items-center text-gray-500 text-sm mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            {service.duration} min
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {service.description}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="text-sm text-gray-500 ml-2">4.9</span>
                        </div>

                        {/* Book Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleServiceSelect(service)
                          }}
                          className={`
                            px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
                            ${isSelected
                              ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Continue Button */}
      {selectedService && (
        <div className="mt-12 text-center">
          <button
            onClick={handleContinue}
            className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-12 py-4 rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold text-lg inline-flex items-center space-x-2"
          >
            <span>Continue with {selectedService.name}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <p className="text-gray-500 text-sm mt-2">
            You can change your service selection at any time
          </p>
        </div>
      )}

      {/* Loading State */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full" />
            <span className="text-gray-700">Loading...</span>
          </div>
        </div>
      )}
    </div>
  )
}