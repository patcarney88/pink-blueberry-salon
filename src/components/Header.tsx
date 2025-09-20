'use client'

import Link from 'next/link'
import CartIcon from '@/components/cart/CartIcon'
import MobileMenu from '@/components/MobileMenu'

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-blue-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">PB</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                Pink Blueberry
              </span>
              <div className="text-sm text-gray-600 -mt-1">Premium Salon</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/services" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              Services
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              Products
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-pink-600 transition-colors font-medium">
              Contact
            </Link>
            <CartIcon />
            <Link
              href="/booking"
              className="bg-gradient-to-r from-pink-600 to-blue-600 text-white px-6 py-2 rounded-full hover:from-pink-700 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile Navigation */}
          <MobileMenu />
        </nav>
      </div>
    </header>
  )
}