'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, Star, Trophy, Clock } from 'lucide-react'

interface Stat {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
  color: string
}

const stats: Stat[] = [
  {
    icon: <Users className="h-8 w-8" />,
    value: 5000,
    suffix: '+',
    label: 'Happy Clients',
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: <Star className="h-8 w-8" />,
    value: 4.9,
    suffix: '★',
    label: 'Average Rating',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: <Trophy className="h-8 w-8" />,
    value: 25,
    suffix: '+',
    label: 'Awards Won',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: <Clock className="h-8 w-8" />,
    value: 10,
    suffix: ' Years',
    label: 'Experience',
    color: 'from-blue-500 to-blue-600',
  },
]

function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const startTime = Date.now()
          const endValue = value
          const isDecimal = value % 1 !== 0

          const animate = () => {
            const now = Date.now()
            const progress = Math.min((now - startTime) / duration, 1)

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            const current = easeOutQuart * endValue

            setDisplayValue(current)

            if (progress < 1) {
              requestAnimationFrame(animate)
            } else {
              setDisplayValue(endValue)
            }
          }

          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [value, duration, hasAnimated])

  const formatValue = (val: number) => {
    if (value % 1 !== 0) {
      return val.toFixed(1)
    }
    return Math.floor(val).toLocaleString()
  }

  return <span ref={ref}>{formatValue(displayValue)}</span>
}

export default function AnimatedStats() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-gradient bg-[length:200%_200%]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Journey in{' '}
            <span className="bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
              Numbers
            </span>
          </h2>
          <p className="text-gray-600 text-lg">
            Excellence measured by satisfaction
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={`
                  bg-white rounded-2xl p-8 text-center
                  transform transition-all duration-500 ease-out
                  ${hoveredIndex === index ? 'scale-110 -translate-y-2' : 'scale-100'}
                  shadow-lg hover:shadow-2xl
                  border border-gray-100 hover:border-transparent
                  relative overflow-hidden
                `}
              >
                {/* Gradient background on hover */}
                <div
                  className={`
                    absolute inset-0 bg-gradient-to-br ${stat.color}
                    transition-opacity duration-500
                    ${hoveredIndex === index ? 'opacity-5' : 'opacity-0'}
                  `}
                />

                {/* Floating animation for icon */}
                <div
                  className={`
                    inline-flex items-center justify-center
                    w-16 h-16 rounded-full mb-4
                    bg-gradient-to-r ${stat.color}
                    text-white
                    ${hoveredIndex === index ? 'animate-bounce-soft' : ''}
                  `}
                >
                  {stat.icon}
                </div>

                {/* Animated number */}
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  <AnimatedNumber value={stat.value} />
                  <span className="text-3xl">{stat.suffix}</span>
                </div>

                {/* Label */}
                <p className="text-gray-600 font-medium">{stat.label}</p>

                {/* Decorative element */}
                <div
                  className={`
                    absolute bottom-0 left-0 right-0 h-1
                    bg-gradient-to-r ${stat.color}
                    transform transition-transform duration-500 origin-left
                    ${hoveredIndex === index ? 'scale-x-100' : 'scale-x-0'}
                  `}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Additional decorative elements */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            Trusted by leading beauty influencers and celebrities
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['💅', '💄', '💆‍♀️', '💇‍♀️', '✨'].map((emoji, i) => (
              <span
                key={i}
                className="text-4xl animate-float"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}