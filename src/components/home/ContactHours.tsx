'use client'

import { Phone, MapPin, Clock, Instagram, Facebook, Mail, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

const businessHours = [
  { day: 'Monday', hours: '10:00 AM - 6:00 PM', open: true },
  { day: 'Tuesday', hours: '9:30 AM - 7:00 PM', open: true },
  { day: 'Wednesday', hours: 'CLOSED', open: false },
  { day: 'Thursday', hours: '9:30 AM - 7:00 PM', open: true },
  { day: 'Friday', hours: '9:30 AM - 7:00 PM', open: true },
  { day: 'Saturday', hours: '9:00 AM - 6:00 PM', open: true },
  { day: 'Sunday', hours: '11:00 AM - 5:00 PM', open: true }
]

export default function ContactHours() {
  const currentDay = new Date().getDay()
  const dayMap = [6, 0, 1, 2, 3, 4, 5] // Map Sunday (0) to our array index
  const todayIndex = dayMap[currentDay]

  const isOpenNow = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const today = businessHours[todayIndex]

    if (!today.open) return false

    // This is a simplified check - in production you'd want more robust time parsing
    const isAfterOpening = currentHour >= 9
    const isBeforeClosing = currentHour < 19

    return isAfterOpening && isBeforeClosing
  }

  return (
    <section className="relative py-20 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-100 to-transparent rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-light text-gray-900 mb-6">
            Visit Our
            <span className="block text-6xl md:text-7xl bg-gradient-to-r from-pink-600 via-amber-500 to-blue-600 bg-clip-text text-transparent font-bold font-[family-name:var(--font-dancing-script)]">
              Salon
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conveniently located in the heart of Apopka, we&apos;re here to serve your beauty needs
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Contact Information Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="backdrop-blur-md bg-white/80 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Contact Us</h3>
            </div>

            <div className="space-y-4">
              {/* Phone - Click to Call */}
              <a
                href="tel:4075749525"
                className="flex items-start space-x-3 group hover:bg-pink-50 p-3 rounded-xl transition-colors duration-300"
              >
                <Phone className="w-5 h-5 text-pink-500 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                    (407) 574-9525
                  </p>
                  <p className="text-sm text-gray-500">Click to call</p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:info@thepinkblueberry.com"
                className="flex items-start space-x-3 group hover:bg-blue-50 p-3 rounded-xl transition-colors duration-300"
              >
                <Mail className="w-5 h-5 text-blue-500 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    info@thepinkblueberry.com
                  </p>
                  <p className="text-sm text-gray-500">Email us anytime</p>
                </div>
              </a>

              {/* Social Media */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Follow Us</p>
                <div className="flex space-x-3">
                  <a
                    href="https://instagram.com/the_pink_blueberry1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300"
                  >
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                  <a
                    href="https://facebook.com/thepinkblueberry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300"
                  >
                    <Facebook className="w-5 h-5 text-white" />
                  </a>
                </div>
                <p className="text-sm text-gray-600 mt-2">@the_pink_blueberry1</p>
              </div>
            </div>
          </motion.div>

          {/* Business Hours Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="backdrop-blur-md bg-white/80 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mr-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Business Hours</h3>
                {isOpenNow() ? (
                  <p className="text-sm text-green-600 font-medium">Open Now</p>
                ) : (
                  <p className="text-sm text-red-600 font-medium">Closed</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {businessHours.map((schedule, index) => (
                <div
                  key={schedule.day}
                  className={`flex justify-between items-center py-2 px-3 rounded-lg transition-colors duration-300 ${
                    index === todayIndex
                      ? 'bg-gradient-to-r from-pink-50 to-blue-50 border border-pink-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`font-medium ${
                      index === todayIndex ? 'text-pink-600' : 'text-gray-700'
                    }`}
                  >
                    {schedule.day}
                    {index === todayIndex && (
                      <span className="ml-2 text-xs text-pink-500">(Today)</span>
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      schedule.open ? 'text-gray-600' : 'text-red-600 font-semibold'
                    }`}
                  >
                    {schedule.hours}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-amber-50 rounded-xl">
              <p className="text-sm text-amber-800">
                💡 <strong>Tip:</strong> Book online 24/7 for your convenience!
              </p>
            </div>
          </motion.div>

          {/* Location Card with Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="backdrop-blur-md bg-white/80 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Location</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900 mb-1">The Pink Blueberry</p>
                <p className="text-gray-600">
                  2300 E Semoran Blvd<br />
                  Suite 401<br />
                  Apopka, FL 32703
                </p>
              </div>

              {/* Interactive Map Preview */}
              <div className="relative h-48 bg-gray-100 rounded-xl overflow-hidden group">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3500.0!2d-81.4683!3d28.6891!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDQxJzIwLjgiTiA4McKwMjgnMDUuOSJX!5e0!3m2!1sen!2sus!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale group-hover:grayscale-0 transition-all duration-500"
                ></iframe>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
              </div>

              {/* Directions Button */}
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=2300+E+Semoran+Blvd+Suite+401+Apopka+FL+32703"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold group"
              >
                <MapPin className="w-5 h-5" />
                <span>Get Directions</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </a>

              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800">
                  📍 Located in the Semoran Plaza, with ample free parking
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 mb-8">
            Ready to experience luxury beauty? We can't wait to see you!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/booking"
              className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-10 py-5 rounded-full hover:shadow-xl transition-all duration-500 font-semibold text-lg inline-flex items-center group"
            >
              Book Appointment Online
              <ExternalLink className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
            <a
              href="tel:4075749525"
              className="backdrop-blur-md bg-white/60 border-2 border-amber-300 text-gray-700 px-10 py-5 rounded-full hover:bg-white/80 hover:border-amber-400 transition-all duration-500 font-semibold text-lg inline-flex items-center"
            >
              <Phone className="mr-3 w-5 h-5" />
              Call Now
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}