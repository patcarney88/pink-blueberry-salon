'use client'

import EnhancedHero from '@/components/home/EnhancedHero'
import ServiceShowcase from '@/components/home/ServiceShowcase'
import OrganicSoapSection from '@/components/home/OrganicSoapSection'
import ContactHours from '@/components/home/ContactHours'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Enhanced Animated Watercolor Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-blue-50"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-15">
          <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-gradient-to-br from-pink-200 via-pink-100 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-[400px] h-[400px] bg-gradient-to-br from-blue-200 via-blue-100 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-[350px] h-[350px] bg-gradient-to-br from-amber-200 via-amber-100 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-pink-100 via-blue-100 to-amber-100 rounded-full blur-3xl opacity-30 animate-pulse delay-3000"></div>
        </div>
        {/* Floating watercolor spots */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-32 left-1/4 w-32 h-32 bg-pink-300 rounded-full blur-2xl animate-float"></div>
          <div className="absolute top-96 right-1/4 w-24 h-24 bg-blue-300 rounded-full blur-2xl animate-float delay-1000"></div>
          <div className="absolute bottom-32 left-1/2 w-28 h-28 bg-amber-300 rounded-full blur-2xl animate-float delay-2000"></div>
        </div>
      </div>


      {/* Header */}
      <header className="relative z-10 backdrop-blur-md bg-white/80 border-b border-white/20 sticky top-0">
        <div className="container mx-auto px-6 py-6">
          <nav className="flex items-center justify-between">
            {/* Luxury Watercolor Blueberry Logo */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                {/* Watercolor blueberry effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 rounded-full blur-sm opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                  {/* Blueberry texture */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full relative overflow-hidden">
                    <div className="absolute top-1 left-1 w-2 h-2 bg-blue-300 rounded-full opacity-60"></div>
                    <div className="absolute top-2 right-1 w-1 h-1 bg-blue-200 rounded-full opacity-40"></div>
                    <div className="absolute bottom-1 left-2 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-50"></div>
                    {/* Blueberry crown */}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-green-500 rounded-t-full opacity-80"></div>
                  </div>
                </div>
                {/* Gold accent sparkle */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full opacity-80 animate-pulse shadow-md">
                  <div className="absolute inset-1 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full">
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-amber-100 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div>
                {/* Gold Calligraphy Script */}
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent tracking-wide font-[family-name:var(--font-dancing-script)]">
                  The Pink Blueberry
                </h1>
                <p className="text-sm text-gray-600 font-light tracking-widest uppercase">Luxury Beauty Salon</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              <Link href="#services" className="text-gray-700 hover:text-pink-600 transition-all duration-300 font-medium text-lg tracking-wide relative group">
                Services
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#about" className="text-gray-700 hover:text-pink-600 transition-all duration-300 font-medium text-lg tracking-wide relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#contact" className="text-gray-700 hover:text-pink-600 transition-all duration-300 font-medium text-lg tracking-wide relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/booking"
                className="relative bg-gradient-to-r from-pink-500 to-blue-500 text-white px-8 py-4 rounded-3xl hover:shadow-2xl hover:shadow-amber-200 transition-all duration-300 font-semibold text-lg tracking-wide group overflow-hidden"
              >
                <span className="relative z-10">Book Now</span>
                {/* Gold glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-3xl"></div>
                {/* Shimmer effect */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-full transition-all duration-700 transform skew-x-12"></div>
              </Link>
            </div>
          </nav>
        </div>
      </header>


      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-6xl mx-auto">
            {/* 72px Headlines as specified */}
            <h2 className="text-7xl md:text-8xl font-light text-gray-900 mb-8 leading-tight tracking-wide">
              Where Beauty Meets
              <span className="block bg-gradient-to-r from-pink-600 via-amber-500 to-blue-600 bg-clip-text text-transparent font-bold font-[family-name:var(--font-dancing-script)]">
                Luxury
              </span>
            </h2>
            {/* 24px Subheading */}
            <p className="text-2xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed font-light tracking-wide">
              Experience the art of beauty in our sophisticated salon, where every service is crafted with precision and care.
              Step into a world of elegance and let our master stylists transform your vision into reality.
            </p>

            {/* Enhanced CTA Buttons with Glass-morphism */}
            <div className="flex flex-col lg:flex-row gap-8 justify-center items-center">
              <Link
                href="/booking"
                className="group relative bg-gradient-to-r from-pink-500 to-blue-500 text-white px-12 py-6 rounded-3xl hover:shadow-2xl transition-all duration-500 inline-flex items-center justify-center font-semibold text-xl tracking-wide overflow-hidden"
              >
                {/* Gold glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-3xl blur-xl"></div>
                <span className="relative z-10 flex items-center">
                  Book Your Appointment
                  <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
                {/* Shimmer animation */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:left-full transition-all duration-1000 transform skew-x-12"></div>
              </Link>

              <Link
                href="#services"
                className="group relative backdrop-blur-md bg-white/20 border-2 border-white/30 text-gray-700 px-12 py-6 rounded-3xl hover:bg-white/40 hover:border-pink-300 transition-all duration-500 font-semibold text-xl tracking-wide overflow-hidden"
              >
                <span className="relative z-10">Explore Services</span>
                {/* Glass morphism hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-100/20 to-blue-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </Link>
            </div>

            {/* Luxury Trust Indicators */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-6 hover:bg-white/40 transition-all duration-300">
                <div className="text-3xl mb-3">✨</div>
                <div className="text-lg font-semibold text-gray-800 mb-2">Premium Experience</div>
                <div className="text-gray-600">Luxury treatments with the finest products</div>
              </div>
              <div className="backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-6 hover:bg-white/40 transition-all duration-300">
                <div className="text-3xl mb-3">🏆</div>
                <div className="text-lg font-semibold text-gray-800 mb-2">Award Winning</div>
                <div className="text-gray-600">Recognized excellence in beauty & style</div>
              </div>
              <div className="backdrop-blur-md bg-white/30 border border-white/20 rounded-2xl p-6 hover:bg-white/40 transition-all duration-300">
                <div className="text-3xl mb-3">💎</div>
                <div className="text-lg font-semibold text-gray-800 mb-2">Master Stylists</div>
                <div className="text-gray-600">Expert professionals with artistic vision</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Pottery Barn Aesthetic */}
      <section id="services" className="relative z-10 py-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h3 className="text-6xl font-light text-gray-900 mb-8 tracking-wide">Our Signature Services</h3>
            <div className="text-3xl mb-6 bg-gradient-to-r from-pink-600 via-amber-500 to-blue-600 bg-clip-text text-transparent font-bold font-[family-name:var(--font-dancing-script)]">
              Crafted with Excellence
            </div>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-light">
              Indulge in our carefully curated selection of premium beauty treatments, designed to enhance your natural radiance
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
            {/* Service 1 - Enhanced with Glass-morphism */}
            <div className="group relative backdrop-blur-lg bg-white/60 border border-white/20 rounded-3xl p-10 hover:bg-white/80 transition-all duration-700 hover:-translate-y-6 hover:rotate-1 shadow-2xl hover:shadow-pink-200/50">
              {/* Elegant icon with luxury styling */}
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                  <span className="text-3xl">✂️</span>
                </div>
                {/* Floating accent */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
              </div>

              <h4 className="text-3xl font-bold text-gray-900 mb-6 tracking-wide">Shampoo & Cut</h4>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Professional hair cutting and styling with premium products. Includes consultation, wash, precision cut, and signature styling.
              </p>

              {/* Elegant pricing display */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-5xl font-light bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                  $30
                </span>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-lg text-gray-500 ml-3 font-medium">4.9</span>
                </div>
              </div>

              {/* Luxury book button */}
              <button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-4 px-8 rounded-2xl hover:from-pink-600 hover:to-pink-700 transition-all duration-300 font-semibold text-lg tracking-wide shadow-lg hover:shadow-pink-200 hover:-translate-y-1">
                Book Service
              </button>
            </div>

            {/* Service 2 */}
            <div className="group relative backdrop-blur-lg bg-white/60 border border-white/20 rounded-3xl p-10 hover:bg-white/80 transition-all duration-700 hover:-translate-y-6 hover:-rotate-1 shadow-2xl hover:shadow-blue-200/50">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-lg">
                  <span className="text-3xl">🎨</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
              </div>

              <h4 className="text-3xl font-bold text-gray-900 mb-6 tracking-wide">Full Highlights</h4>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Transform your look with masterful highlighting techniques using premium color systems for stunning, natural-looking results.
              </p>

              <div className="flex items-center justify-between mb-8">
                <span className="text-5xl font-light bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                  $120
                </span>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-lg text-gray-500 ml-3 font-medium">4.9</span>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-8 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold text-lg tracking-wide shadow-lg hover:shadow-blue-200 hover:-translate-y-1">
                Book Service
              </button>
            </div>

            {/* Service 3 */}
            <div className="group relative backdrop-blur-lg bg-white/60 border border-white/20 rounded-3xl p-10 hover:bg-white/80 transition-all duration-700 hover:-translate-y-6 hover:rotate-1 shadow-2xl hover:shadow-amber-200/50">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                  <span className="text-3xl">💫</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
              </div>

              <h4 className="text-3xl font-bold text-gray-900 mb-6 tracking-wide">Specialty Perms</h4>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Create lasting texture and volume with advanced perm techniques, customized to your hair type and desired style goals.
              </p>

              <div className="flex items-center justify-between mb-8">
                <span className="text-5xl font-light bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                  $100+
                </span>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-lg text-gray-500 ml-3 font-medium">4.9</span>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-8 rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold text-lg tracking-wide shadow-lg hover:shadow-amber-200 hover:-translate-y-1">
                Book Service
              </button>
            </div>
          </div>

          {/* Luxury Call-to-Action */}
          <div className="text-center mt-20">
            <Link
              href="/services"
              className="group inline-flex items-center backdrop-blur-md bg-white/40 border-2 border-white/30 text-gray-700 px-12 py-6 rounded-3xl hover:bg-white/60 hover:border-amber-300 transition-all duration-500 font-semibold text-xl tracking-wide"
            >
              <span className="relative z-10">View All Services</span>
              <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 bg-gradient-to-br from-pink-50 to-blue-50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-5xl font-bold text-gray-900 mb-8">The Pink Blueberry Experience</h3>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Step into our world of luxury and sophistication. Our salon combines the finest beauty techniques 
              with an atmosphere of elegance and relaxation. Every detail is crafted to provide you with an 
              exceptional experience that leaves you feeling beautiful, confident, and refreshed.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌟</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Premium Products</h4>
                <p className="text-gray-600">Only the finest, professional-grade products</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👩‍🎨</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Expert Stylists</h4>
                <p className="text-gray-600">Highly trained professionals with years of experience</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💎</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Luxury Atmosphere</h4>
                <p className="text-gray-600">Sophisticated, relaxing environment designed for comfort</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-5xl font-bold text-gray-900 mb-8">Visit Us Today</h3>
          <p className="text-xl text-gray-600 mb-12">
            Ready to experience luxury beauty? Book your appointment today.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Call Us</p>
                <p className="text-gray-600">(555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Visit Us</p>
                <p className="text-gray-600">123 Beauty Lane, Style City</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-blue-500 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Hours</p>
                <p className="text-gray-600">Mon-Sat: 9AM-7PM</p>
              </div>
            </div>
          </div>

          <Link
            href="/booking"
            className="inline-block bg-gradient-to-r from-pink-500 to-blue-500 text-white px-12 py-5 rounded-2xl hover:shadow-2xl hover:shadow-pink-200 transition-all duration-300 font-semibold text-lg"
          >
            Book Your Appointment
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full"></div>
            </div>
            <h4 className="text-2xl font-bold">The Pink Blueberry</h4>
          </div>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Luxury beauty salon dedicated to providing exceptional service and creating beautiful, confident clients.
          </p>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-500">
              © 2024 The Pink Blueberry. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}