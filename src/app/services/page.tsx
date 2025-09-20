import Link from 'next/link'
import { Star, Clock, ArrowRight, Check } from 'lucide-react'
import Header from '@/components/Header'

export default function ServicesPage() {
  const services = [
    {
      category: "Hair Cutting & Styling",
      description: "Expert cuts and styling for every occasion",
      services: [
        { name: "Precision Cut & Style", price: 85, duration: 60, description: "Professional consultation, wash, precision cut, and styling" },
        { name: "Trim & Touch-Up", price: 45, duration: 30, description: "Quick trim to maintain your current style" },
        { name: "Blow Dry & Style", price: 35, duration: 30, description: "Professional blow dry and styling only" },
        { name: "Special Event Styling", price: 120, duration: 90, description: "Elegant updo or special occasion styling" }
      ]
    },
    {
      category: "Color Services",
      description: "Transform your look with stunning color",
      services: [
        { name: "Full Color", price: 120, duration: 120, description: "Complete color transformation with premium products" },
        { name: "Root Touch-Up", price: 75, duration: 60, description: "Refresh your roots to maintain your color" },
        { name: "Full Highlights", price: 150, duration: 150, description: "Complete highlighting service for dimension and brightness" },
        { name: "Partial Highlights", price: 100, duration: 90, description: "Strategic highlights around the face and crown" },
        { name: "Balayage", price: 180, duration: 180, description: "Hand-painted highlights for natural-looking dimension" },
        { name: "Color Correction", price: 250, duration: 240, description: "Fix previous color mishaps with expert correction" }
      ]
    },
    {
      category: "Hair Treatments",
      description: "Restore and nourish your hair",
      services: [
        { name: "Deep Conditioning Treatment", price: 45, duration: 30, description: "Intensive moisture treatment for damaged hair" },
        { name: "Keratin Smoothing Treatment", price: 200, duration: 180, description: "Reduce frizz and smooth texture for months" },
        { name: "Scalp Treatment", price: 65, duration: 45, description: "Therapeutic scalp massage and treatment" },
        { name: "Hair Gloss", price: 55, duration: 45, description: "Add shine and enhance color vibrancy" }
      ]
    },
    {
      category: "Extensions & Enhancements",
      description: "Add length, volume, and versatility",
      services: [
        { name: "Tape-In Extensions", price: 350, duration: 120, description: "Semi-permanent extensions lasting 6-8 weeks" },
        { name: "Clip-In Extensions", price: 200, duration: 60, description: "Temporary extensions perfect for special events" },
        { name: "Hand-Tied Wefts", price: 500, duration: 180, description: "Premium extensions for maximum comfort and natural look" },
        { name: "Extension Maintenance", price: 85, duration: 60, description: "Tightening and repositioning existing extensions" }
      ]
    },
    {
      category: "Bridal & Special Events",
      description: "Look stunning on your special day",
      services: [
        { name: "Bridal Hair Trial", price: 150, duration: 90, description: "Practice session to perfect your wedding day look" },
        { name: "Bridal Hair Styling", price: 200, duration: 120, description: "Wedding day hair styling at salon or on-location" },
        { name: "Bridal Party Package", price: 120, duration: 90, description: "Hair styling for bridesmaids (per person)" },
        { name: "Mother of Bride/Groom", price: 130, duration: 75, description: "Elegant styling for special family members" }
      ]
    },
    {
      category: "Men's Services",
      description: "Sharp cuts and classic styling",
      services: [
        { name: "Men's Cut & Style", price: 55, duration: 45, description: "Professional cut with wash and styling" },
        { name: "Beard Trim", price: 25, duration: 20, description: "Precision beard shaping and styling" },
        { name: "Men's Color", price: 85, duration: 60, description: "Gray coverage or complete color change" },
        { name: "Classic Shave", price: 45, duration: 30, description: "Traditional hot towel shave experience" }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-6">
              Our <span className="bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent font-bold">Signature</span> Services
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover our comprehensive menu of luxury beauty services, each designed to enhance your natural radiance
              and leave you feeling confident and beautiful.
            </p>
            <div className="flex justify-center items-center space-x-1 text-yellow-500 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-current" />
              ))}
              <span className="ml-3 text-gray-600 text-lg">Rated 4.9/5 by 2,000+ clients</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto space-y-16">
            {services.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-3xl shadow-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-pink-600 to-blue-600 px-8 py-6">
                  <h2 className="text-3xl font-bold text-white mb-2">{category.category}</h2>
                  <p className="text-pink-100 text-lg">{category.description}</p>
                </div>

                {/* Services List */}
                <div className="p-8">
                  <div className="grid lg:grid-cols-2 gap-6">
                    {category.services.map((service, serviceIndex) => (
                      <div key={serviceIndex} className="group border border-gray-200 rounded-2xl p-6 hover:border-pink-300 hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                            {service.name}
                          </h3>
                          <div className="text-right">
                            <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                              ${service.price}
                            </div>
                            <div className="flex items-center text-gray-500 text-sm mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              {service.duration} min
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {service.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-sm text-gray-500 ml-2">4.9</span>
                          </div>
                          <Link
                            href="/booking"
                            className="inline-flex items-center text-pink-600 hover:text-pink-800 font-medium group-hover:translate-x-1 transition-all"
                          >
                            Book Now <ArrowRight className="h-4 w-4 ml-1" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Packages Section */}
          <div className="bg-gradient-to-br from-pink-50 to-blue-50 rounded-3xl p-12 mt-20">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Popular Packages</h2>
              <p className="text-xl text-gray-600 mb-12">
                Save more with our specially curated service packages
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Refresh Package */}
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="bg-gradient-to-br from-pink-400 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Refresh Package</h3>
                  <p className="text-gray-600 mb-6">Cut, style, and deep conditioning treatment</p>
                  <div className="text-3xl font-bold text-pink-600 mb-2">$115</div>
                  <div className="text-gray-500 line-through mb-6">Regular $130</div>
                  <ul className="text-left space-y-2 mb-8">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Precision Cut & Style</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Deep Conditioning</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Scalp Massage</span>
                    </li>
                  </ul>
                  <Link
                    href="/booking"
                    className="w-full bg-gradient-to-r from-pink-600 to-pink-700 text-white py-3 rounded-lg hover:from-pink-700 hover:to-pink-800 transition-colors font-medium block text-center"
                  >
                    Book Package
                  </Link>
                </div>

                {/* Transform Package */}
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border-2 border-pink-200">
                  <div className="bg-gradient-to-br from-pink-500 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">🌟</span>
                  </div>
                  <div className="bg-pink-600 text-white px-3 py-1 rounded-full text-sm font-medium inline-block mb-4">
                    Most Popular
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Transform Package</h3>
                  <p className="text-gray-600 mb-6">Complete makeover with color and styling</p>
                  <div className="text-3xl font-bold text-blue-600 mb-2">$220</div>
                  <div className="text-gray-500 line-through mb-6">Regular $255</div>
                  <ul className="text-left space-y-2 mb-8">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Full Color Service</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Precision Cut & Style</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Hair Gloss Treatment</span>
                    </li>
                  </ul>
                  <Link
                    href="/booking"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors font-medium block text-center"
                  >
                    Book Package
                  </Link>
                </div>

                {/* Luxury Package */}
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="bg-gradient-to-br from-purple-400 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">👑</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Luxury Experience</h3>
                  <p className="text-gray-600 mb-6">Ultimate pampering with premium treatments</p>
                  <div className="text-3xl font-bold text-purple-600 mb-2">$350</div>
                  <div className="text-gray-500 line-through mb-6">Regular $400</div>
                  <ul className="text-left space-y-2 mb-8">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Balayage or Highlights</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Precision Cut & Style</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Keratin Treatment</span>
                    </li>
                  </ul>
                  <Link
                    href="/booking"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors font-medium block text-center"
                  >
                    Book Package
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Transform Your Look?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Book your appointment today and experience the luxury of Pink Blueberry Salon
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center bg-gradient-to-r from-pink-600 to-blue-600 text-white px-8 py-4 rounded-full hover:from-pink-700 hover:to-blue-700 transition-all duration-200 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Book Your Appointment <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}