'use client'

import { useState, useEffect } from 'react'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Regular Client',
    image: '👩‍🦰',
    rating: 5,
    text: 'The AI Beauty Advisor completely transformed my skincare routine! I\'ve never had such personalized recommendations. My skin has never looked better!',
    service: 'Hydrating Facial & AI Consultation',
  },
  {
    id: 2,
    name: 'Maria Garcia',
    role: 'VIP Member',
    image: '👩‍🦱',
    rating: 5,
    text: 'Pink BlueBerry is not just a salon, it\'s an experience! The attention to detail and the premium products they use make every visit special.',
    service: 'Full Hair Transformation',
  },
  {
    id: 3,
    name: 'Emily Chen',
    role: 'First-Time Client',
    image: '👩',
    rating: 5,
    text: 'I was amazed by the technology here! Being able to book through the app and get AI recommendations before my visit was incredible.',
    service: 'Spa Package',
  },
  {
    id: 4,
    name: 'Jessica Williams',
    role: 'Beauty Influencer',
    image: '👱‍♀️',
    rating: 5,
    text: 'The most innovative salon I\'ve ever visited! The combination of traditional beauty expertise and cutting-edge AI technology is unmatched.',
    service: 'Complete Makeover',
  },
  {
    id: 5,
    name: 'Amanda Davis',
    role: 'Corporate Executive',
    image: '👩‍💼',
    rating: 5,
    text: 'As a busy professional, I love how the app remembers my preferences and schedules. The PWA works perfectly even when I\'m offline!',
    service: 'Express Beauty Service',
  },
]

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (!autoPlay) return

    const interval = setInterval(() => {
      handleNext()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentIndex, autoPlay])

  const handleNext = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
      setIsAnimating(false)
    }, 300)
  }

  const handlePrev = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
      setIsAnimating(false)
    }, 300)
  }

  const handleDotClick = (index: number) => {
    if (isAnimating || index === currentIndex) return
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex(index)
      setIsAnimating(false)
    }, 300)
  }

  return (
    <section className="py-20 bg-gradient-to-br from-pink-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-pink-200 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
            What Our Clients Say
          </h2>
          <p className="text-gray-600 text-lg">
            Join thousands of satisfied customers who love our services
          </p>
        </div>

        <div
          className="max-w-4xl mx-auto relative"
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          {/* Main testimonial card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 relative">
            {/* Quote icon */}
            <div className="absolute -top-6 left-8 bg-gradient-to-r from-pink-500 to-blue-500 w-12 h-12 rounded-full flex items-center justify-center">
              <Quote className="h-6 w-6 text-white" />
            </div>

            {/* Content */}
            <div
              className={`transition-all duration-300 ${
                isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
              }`}
            >
              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current animate-pulse-subtle"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>

              {/* Testimonial text */}
              <p className="text-gray-700 text-lg md:text-xl mb-6 italic leading-relaxed">
                "{testimonials[currentIndex].text}"
              </p>

              {/* Author info */}
              <div className="flex items-center">
                <div className="text-4xl mr-4 animate-bounce-soft">
                  {testimonials[currentIndex].image}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {testimonials[currentIndex].name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {testimonials[currentIndex].role}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Service: {testimonials[currentIndex].service}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 hover:bg-white"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 hover:bg-white"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 h-2 bg-gradient-to-r from-pink-500 to-blue-500'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                } rounded-full`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600">5,000+</div>
              <div className="text-sm text-gray-600">Happy Clients</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">4.9★</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">50+</div>
              <div className="text-sm text-gray-600">Expert Stylists</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}