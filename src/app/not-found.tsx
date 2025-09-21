'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-6">
      {/* Floating elements background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-200 rounded-full blur-3xl opacity-20 animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* 404 Number with gradient */}
        <div className="mb-8">
          <h1 className="text-[150px] md:text-[200px] font-bold leading-none bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-pulse-subtle">
            404
          </h1>
        </div>

        {/* Error message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 text-lg">
            Looks like this beauty treatment doesn't exist yet!
          </p>
          <p className="text-gray-500 mt-2">
            The page you're looking for might have been moved, deleted, or perhaps it never existed.
          </p>
        </div>

        {/* Decorative emojis */}
        <div className="flex justify-center gap-4 mb-8 text-4xl">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>💅</span>
          <span className="animate-bounce" style={{ animationDelay: '100ms' }}>💄</span>
          <span className="animate-bounce" style={{ animationDelay: '200ms' }}>✨</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>💆‍♀️</span>
          <span className="animate-bounce" style={{ animationDelay: '400ms' }}>💇‍♀️</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          >
            <Home className="mr-2 h-5 w-5 group-hover:animate-bounce-soft" />
            Go Home
          </Link>

          <Link
            href="/book"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200 group"
          >
            <Search className="mr-2 h-5 w-5 group-hover:animate-spin-slow" />
            Book Appointment
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-all duration-300 hover:scale-105 group"
          >
            <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
        </div>

        {/* Fun message */}
        <div className="mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
          <p className="text-gray-600 italic">
            "While you're here, why not check out our{' '}
            <Link href="/?ai=true" className="text-purple-600 hover:text-purple-700 font-semibold underline">
              AI Beauty Advisor
            </Link>
            {' '}for personalized recommendations?"
          </p>
        </div>
      </div>
    </div>
  )
}