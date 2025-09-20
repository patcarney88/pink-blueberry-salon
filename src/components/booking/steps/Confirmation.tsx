'use client'

import { useState } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { Calendar, Clock, User, Mail, Phone, MessageSquare, CreditCard, Check, Star, Award } from 'lucide-react'

const formatTime = (time: string): string => {
  const [hour, minute] = time.split(':')
  const hourNum = parseInt(hour)
  const ampm = hourNum >= 12 ? 'PM' : 'AM'
  const displayHour = hourNum % 12 || 12
  return `${displayHour}:${minute} ${ampm}`
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function Confirmation() {
  const { state, prevStep, confirmBooking } = useBooking()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const { service, stylist, date, time, contactInfo } = state.bookingData

  const handleConfirmBooking = async () => {
    setIsConfirming(true)

    // Simulate API call
    setTimeout(() => {
      confirmBooking()
      setIsConfirming(false)
      setIsConfirmed(true)
    }, 2000)
  }

  if (isConfirmed) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-xl p-12 mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-4xl font-light text-gray-900 mb-4">Booking Confirmed!</h2>
          <p className="text-xl text-gray-600 mb-8">
            Your appointment has been successfully scheduled. We've sent a confirmation email with all the details.
          </p>

          <div className="bg-white rounded-2xl p-8 mb-8 text-left">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Your Appointment Details</h3>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Service & Stylist */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{service?.name}</h4>
                    <p className="text-gray-600">{service?.duration} minutes • ${service?.price}</p>
                    <p className="text-sm text-gray-500 mt-1">{service?.description}</p>
                  </div>
                </div>

                {stylist && (
                  <div className="flex items-start space-x-4">
                    <img
                      src={stylist.avatar}
                      alt={stylist.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{stylist.name}</h4>
                      <p className="text-gray-600">{stylist.title}</p>
                      <div className="flex items-center mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm text-gray-500">{stylist.rating} rating</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Contact */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Date & Time</h4>
                    <p className="text-gray-600">{date && formatDate(date)}</p>
                    <p className="text-gray-600">{time && formatTime(time)}</p>
                  </div>
                </div>

                {contactInfo && (
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Contact Information</h4>
                      <p className="text-gray-600">{contactInfo.firstName} {contactInfo.lastName}</p>
                      <p className="text-gray-600">{contactInfo.email}</p>
                      <p className="text-gray-600">{contactInfo.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-12 py-4 rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold text-lg"
            >
              Return to Home
            </button>

            <p className="text-sm text-gray-500">
              Need to make changes? Call us at (555) 123-4567 or email hello@pinkblueberrysalon.com
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-light text-gray-900 mb-4">Review Your Booking</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Please review all the details below and confirm your appointment. You'll receive a confirmation email once complete.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
        {/* Service Details */}
        {service && (
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center mb-4">
              <Star className="w-6 h-6 text-pink-500 mr-2" />
              <h3 className="text-2xl font-semibold text-gray-900">Service</h3>
            </div>

            <div className="flex items-start space-x-6">
              <img
                src={service.image}
                alt={service.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h4>
                <p className="text-gray-600 mb-3">{service.description}</p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="text-gray-600">{service.duration} minutes</span>
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                    ${service.price}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stylist Details */}
        {stylist && (
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center mb-4">
              <User className="w-6 h-6 text-pink-500 mr-2" />
              <h3 className="text-2xl font-semibold text-gray-900">Your Stylist</h3>
            </div>

            <div className="flex items-start space-x-6">
              <div className="relative">
                <img
                  src={stylist.avatar}
                  alt={stylist.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg"
                />
                {stylist.rating >= 4.8 && (
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">{stylist.name}</h4>
                <p className="text-pink-600 font-medium mb-2">{stylist.title}</p>
                <p className="text-gray-600 mb-3">{stylist.bio}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="text-gray-600">{stylist.experience}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-gray-600">{stylist.rating}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
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
          </div>
        )}

        {/* Date & Time */}
        {date && time && (
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center mb-4">
              <Calendar className="w-6 h-6 text-pink-500 mr-2" />
              <h3 className="text-2xl font-semibold text-gray-900">Date & Time</h3>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Appointment Date</h4>
                  <p className="text-lg text-gray-900">{formatDate(date)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Appointment Time</h4>
                  <p className="text-lg text-gray-900">{formatTime(time)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information */}
        {contactInfo && (
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center mb-4">
              <Mail className="w-6 h-6 text-pink-500 mr-2" />
              <h3 className="text-2xl font-semibold text-gray-900">Contact Information</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{contactInfo.firstName} {contactInfo.lastName}</p>
                    <p className="text-sm text-gray-500">Full Name</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{contactInfo.email}</p>
                    <p className="text-sm text-gray-500">Email Address</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{contactInfo.phone}</p>
                    <p className="text-sm text-gray-500">Phone Number</p>
                  </div>
                </div>

                {contactInfo.notes && (
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">{contactInfo.notes}</p>
                      <p className="text-sm text-gray-500">Special Notes</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <CreditCard className="w-6 h-6 text-pink-500 mr-2" />
            <h3 className="text-2xl font-semibold text-gray-900">Pricing</h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">{service?.name}</span>
              <span className="text-gray-900 font-medium">${service?.price}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
              <span>Duration: {service?.duration} minutes</span>
              <span>No additional fees</span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                  ${service?.price}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-3">Booking Terms & Conditions</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Please arrive 10 minutes early for your appointment</li>
              <li>• Cancellations must be made at least 24 hours in advance</li>
              <li>• A valid credit card is required to hold your reservation</li>
              <li>• Late arrivals may result in shortened service time or rescheduling</li>
              <li>• We require a 50% deposit for services over $200</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Contact Info</span>
        </button>

        <button
          onClick={handleConfirmBooking}
          disabled={isConfirming}
          className={`
            px-12 py-4 rounded-2xl font-semibold text-lg inline-flex items-center space-x-2 transition-all duration-300
            ${isConfirming
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 to-blue-500 text-white hover:shadow-xl'
            }
          `}
        >
          {isConfirming ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              <span>Confirming...</span>
            </>
          ) : (
            <>
              <span>Confirm Booking</span>
              <Check className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}