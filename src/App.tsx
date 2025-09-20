import React, { useState } from 'react';
import AIBeautyAdvisor from './components/AIBeautyAdvisor';
import type { ServiceRecommendation, ProductRecommendation } from './components/AIBeautyAdvisor/types';

function App() {
  const [cart, setCart] = useState<ProductRecommendation[]>([]);
  const [bookings, setBookings] = useState<ServiceRecommendation[]>([]);

  const handleBookService = (service: ServiceRecommendation) => {
    setBookings(prev => [...prev, service]);
    // In a real app, this would open a booking modal or redirect to booking page
    console.log('Booking service:', service);
    alert(`Service "${service.name}" has been added to your booking request! We'll contact you shortly.`);
  };

  const handleAddToCart = (product: ProductRecommendation) => {
    setCart(prev => [...prev, product]);
    console.log('Adding to cart:', product);
    alert(`"${product.name}" has been added to your cart!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 text-transparent bg-clip-text">
                The Pink Blueberry
              </h1>
              <span className="ml-2 text-sm text-gray-500">AI Beauty Salon</span>
            </div>
            <nav className="flex items-center space-x-8">
              <a href="#services" className="text-gray-700 hover:text-pink-500 transition-colors">
                Services
              </a>
              <a href="#about" className="text-gray-700 hover:text-pink-500 transition-colors">
                About
              </a>
              <a href="#contact" className="text-gray-700 hover:text-pink-500 transition-colors">
                Contact
              </a>
              <div className="relative">
                <button className="flex items-center space-x-1 text-gray-700 hover:text-pink-500 transition-colors">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Experience Beauty with
              <span className="bg-gradient-to-r from-pink-500 to-blue-500 text-transparent bg-clip-text"> AI Innovation</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get personalized beauty recommendations from our AI Beauty Advisor.
              Discover services and products perfectly tailored to your unique style.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="px-8 py-3 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-full font-semibold hover:shadow-lg transition-shadow">
                Start Consultation
              </button>
              <button className="px-8 py-3 bg-white text-gray-700 rounded-full font-semibold border-2 border-gray-200 hover:border-pink-500 transition-colors">
                View Services
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-12 w-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center text-white mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Consultation</h3>
              <p className="text-gray-600">Get personalized recommendations based on your hair type, style preferences, and beauty goals.</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Booking</h3>
              <p className="text-gray-600">Book recommended services instantly with real-time availability and convenient scheduling.</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Trending Styles</h3>
              <p className="text-gray-600">Stay ahead with seasonal trends and discover the latest beauty innovations.</p>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['Hair Cutting', 'Hair Coloring', 'Treatments', 'Styling'].map((service, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{service}</h3>
                <p className="text-gray-600 text-sm">Professional {service.toLowerCase()} services tailored to your needs.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bookings Summary (for demo) */}
      {bookings.length > 0 && (
        <div className="fixed top-20 right-4 bg-white rounded-lg shadow-lg p-4 z-30">
          <h3 className="font-semibold mb-2">Booking Requests ({bookings.length})</h3>
          <ul className="text-sm space-y-1">
            {bookings.map((booking, index) => (
              <li key={index} className="text-gray-600">• {booking.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Beauty Advisor */}
      <AIBeautyAdvisor
        onBookService={handleBookService}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

export default App;