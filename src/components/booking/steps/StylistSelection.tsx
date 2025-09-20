'use client'

import { useState } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { Stylist } from '@/types/booking'
import { Star, Award, Clock, Check, Heart, Users } from 'lucide-react'

// Mock stylist data
const stylists: Stylist[] = [
  {
    id: 'sarah-mitchell',
    name: 'Sarah Mitchell',
    title: 'Owner & Master Stylist',
    experience: '15+ years',
    specialties: ['Color Correction', 'Bridal Styling', 'Extensions'],
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b372?w=300&h=300&fit=crop&crop=face',
    portfolio: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=300&h=300&fit=crop'
    ],
    bio: 'Passionate about creating beautiful, wearable styles that enhance your natural beauty. Specializes in color correction and bridal hair.',
    available: true
  },
  {
    id: 'amanda-chen',
    name: 'Amanda Chen',
    title: 'Creative Director',
    experience: '12+ years',
    specialties: ['Balayage', 'Fashion Color', 'Cutting'],
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    portfolio: [
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=300&h=300&fit=crop'
    ],
    bio: 'Award-winning colorist known for innovative balayage techniques and creative fashion colors. Loves pushing boundaries while maintaining hair health.',
    available: true
  },
  {
    id: 'jessica-rodriguez',
    name: 'Jessica Rodriguez',
    title: 'Senior Stylist',
    experience: '10+ years',
    specialties: ['Curly Hair', 'Keratin Treatments', 'Styling'],
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
    portfolio: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=300&h=300&fit=crop'
    ],
    bio: 'Curly hair specialist with extensive training in natural texture care. Expert in keratin treatments and protective styling techniques.',
    available: true
  },
  {
    id: 'emily-thompson',
    name: 'Emily Thompson',
    title: 'Color Specialist',
    experience: '8+ years',
    specialties: ['Gray Coverage', 'Highlights', 'Color Maintenance'],
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
    portfolio: [
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=300&h=300&fit=crop'
    ],
    bio: 'Precision colorist specializing in natural-looking gray coverage and low-maintenance color solutions. Believes in enhancing your natural beauty.',
    available: false
  }
]

export default function StylistSelection() {
  const { state, setStylist, nextStep, prevStep } = useBooking()
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(state.bookingData.stylist || null)
  const [viewingPortfolio, setViewingPortfolio] = useState<string | null>(null)

  const handleStylistSelect = (stylist: Stylist) => {
    if (!stylist.available) return
    setSelectedStylist(stylist)
    setStylist(stylist)
  }

  const handleContinue = () => {
    if (selectedStylist) {
      nextStep()
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-light text-gray-900 mb-4">Choose Your Stylist</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Our expert stylists are here to bring your vision to life. Each brings unique skills and artistic flair.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {stylists.map((stylist) => {
          const isSelected = selectedStylist?.id === stylist.id
          const isAvailable = stylist.available

          return (
            <div
              key={stylist.id}
              onClick={() => handleStylistSelect(stylist)}
              className={`
                relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden
                ${!isAvailable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected && isAvailable
                  ? 'ring-2 ring-pink-500 shadow-pink-200 transform scale-102'
                  : isAvailable
                  ? 'hover:transform hover:scale-101'
                  : ''
                }
              `}
              role="button"
              tabIndex={isAvailable ? 0 : -1}
              onKeyDown={(e) => {
                if (isAvailable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  handleStylistSelect(stylist)
                }
              }}
              aria-pressed={isSelected}
              aria-label={`${isAvailable ? 'Select' : 'Unavailable'} ${stylist.name} as your stylist`}
            >
              {/* Selection Indicator */}
              {isSelected && isAvailable && (
                <div className="absolute top-4 right-4 z-10 w-8 h-8 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Unavailable Badge */}
              {!isAvailable && (
                <div className="absolute top-4 left-4 z-10 bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Unavailable
                </div>
              )}

              <div className="p-6">
                {/* Stylist Header */}
                <div className="flex items-start space-x-4 mb-6">
                  <div className="relative">
                    <img
                      src={stylist.avatar}
                      alt={stylist.name}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-lg"
                    />
                    {stylist.rating >= 4.8 && (
                      <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{stylist.name}</h3>
                    <p className="text-pink-600 font-medium mb-2">{stylist.title}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {stylist.experience}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                        {stylist.rating}
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-2">
                      {stylist.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-pink-100 to-blue-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-gray-600 mb-6 leading-relaxed">{stylist.bio}</p>

                {/* Portfolio Preview */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Portfolio</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {stylist.portfolio.slice(0, 3).map((image, index) => (
                      <div
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation()
                          setViewingPortfolio(stylist.id)
                        }}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                      >
                        <img
                          src={image}
                          alt={`${stylist.name}'s work ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Heart className="w-4 h-4 text-pink-500 mr-1" />
                      <span className="text-sm font-medium text-gray-700">Client Favorite</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">98%</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-sm font-medium text-gray-700">Happy Clients</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">500+</div>
                  </div>
                </div>

                {/* Select Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isAvailable) handleStylistSelect(stylist)
                  }}
                  disabled={!isAvailable}
                  className={`
                    w-full py-3 rounded-lg font-semibold transition-all duration-200
                    ${isSelected && isAvailable
                      ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white'
                      : isAvailable
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {!isAvailable ? 'Currently Unavailable' : isSelected ? 'Selected' : 'Select Stylist'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Portfolio Modal */}
      {viewingPortfolio && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingPortfolio(null)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                {stylists.find(s => s.id === viewingPortfolio)?.name}'s Portfolio
              </h3>
              <button
                onClick={() => setViewingPortfolio(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stylists.find(s => s.id === viewingPortfolio)?.portfolio.map((image, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`Portfolio piece ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-12 flex justify-between">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Services</span>
        </button>

        {selectedStylist && (
          <button
            onClick={handleContinue}
            className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-12 py-4 rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold text-lg inline-flex items-center space-x-2"
          >
            <span>Continue with {selectedStylist.name}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}