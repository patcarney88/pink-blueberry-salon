'use client'

import { useState, useEffect } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { User, Mail, Phone, MessageSquare, AlertCircle, Check } from 'lucide-react'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  notes: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)\.]/g, ''))
}

const formatPhoneNumber = (value: string): string => {
  const phoneNumber = value.replace(/[^\d]/g, '')
  const phoneNumberLength = phoneNumber.length

  if (phoneNumberLength < 4) return phoneNumber
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
}

export default function ContactInfo() {
  const { state, setContactInfo, nextStep, prevStep } = useBooking()

  const [formData, setFormData] = useState<FormData>({
    firstName: state.bookingData.contactInfo?.firstName || '',
    lastName: state.bookingData.contactInfo?.lastName || '',
    email: state.bookingData.contactInfo?.email || '',
    phone: state.bookingData.contactInfo?.phone || '',
    notes: state.bookingData.contactInfo?.notes || '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate form
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    return newErrors
  }

  // Update errors when form data changes
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validateForm())
    }
  }, [formData, touched])

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === 'phone') {
      value = formatPhoneNumber(value)
    }

    setFormData(prev => ({ ...prev, [field]: value }))

    // Save to booking context
    const updatedContactInfo = { ...formData, [field]: value }
    setContactInfo(updatedContactInfo)
  }

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    })

    const formErrors = validateForm()
    setErrors(formErrors)

    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true)

      // Simulate API call
      setTimeout(() => {
        setContactInfo(formData)
        setIsSubmitting(false)
        nextStep()
      }, 1000)
    }
  }

  const isFormValid = Object.keys(validateForm()).length === 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-light text-gray-900 mb-4">Contact Information</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Please provide your contact details so we can confirm your appointment and send you updates.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onBlur={() => handleBlur('firstName')}
                  className={`
                    block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors
                    ${errors.firstName && touched.firstName
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                    }
                  `}
                  placeholder="Enter your first name"
                  aria-describedby={errors.firstName && touched.firstName ? 'firstName-error' : undefined}
                />
                {!errors.firstName && touched.firstName && formData.firstName && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.firstName && touched.firstName && (
                <p id="firstName-error" className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  onBlur={() => handleBlur('lastName')}
                  className={`
                    block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors
                    ${errors.lastName && touched.lastName
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                    }
                  `}
                  placeholder="Enter your last name"
                  aria-describedby={errors.lastName && touched.lastName ? 'lastName-error' : undefined}
                />
                {!errors.lastName && touched.lastName && formData.lastName && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.lastName && touched.lastName && (
                <p id="lastName-error" className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`
                  block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors
                  ${errors.email && touched.email
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                  }
                `}
                placeholder="your@email.com"
                aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
              />
              {!errors.email && touched.email && formData.email && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            {errors.email && touched.email && (
              <p id="email-error" className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={`
                  block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors
                  ${errors.phone && touched.phone
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                  }
                `}
                placeholder="(555) 123-4567"
                aria-describedby={errors.phone && touched.phone ? 'phone-error' : undefined}
              />
              {!errors.phone && touched.phone && formData.phone && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            {errors.phone && touched.phone && (
              <p id="phone-error" className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Notes Field */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests or Notes (Optional)
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <MessageSquare className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                placeholder="Let us know about any allergies, preferences, or special requests..."
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              This helps us provide the best possible service for your needs.
            </p>
          </div>

          {/* Form Summary */}
          <div className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Contact Information Summary</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 text-gray-900">
                  {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 text-gray-900">{formData.email || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 text-gray-900">{formData.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-gray-600">Notes:</span>
                <span className="ml-2 text-gray-900">{formData.notes || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <strong>Privacy Notice:</strong> Your information is securely stored and will only be used to
              manage your appointment and communicate with you about your visit. We never share your
              personal information with third parties.
            </p>
          </div>
        </form>
      </div>

      {/* Navigation */}
      <div className="mt-12 flex justify-between">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Date & Time</span>
        </button>

        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className={`
            px-12 py-4 rounded-2xl font-semibold text-lg inline-flex items-center space-x-2 transition-all duration-300
            ${isFormValid && !isSubmitting
              ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Review Booking</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}