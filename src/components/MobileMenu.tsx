'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import CartIcon from '@/components/cart/CartIcon'

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center space-x-4">
        <CartIcon />
        <button
          onClick={toggleMenu}
          className="p-2 text-gray-600 hover:text-pink-600 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={closeMenu}>
          <div className="absolute top-0 right-0 w-64 h-full bg-white shadow-xl">
            {/* Menu Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Menu</span>
              <button
                onClick={closeMenu}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="p-4 space-y-4">
              <Link
                href="/services"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors"
              >
                Services
              </Link>
              <Link
                href="/products"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors"
              >
                Products
              </Link>
              <Link
                href="/booking"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors"
              >
                Book Appointment
              </Link>
              <Link
                href="/about"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                onClick={closeMenu}
                className="block py-3 px-4 text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors"
              >
                Contact
              </Link>
              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/auth/signin"
                  onClick={closeMenu}
                  className="block w-full bg-gradient-to-r from-pink-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-pink-700 hover:to-blue-700 transition-all duration-200 text-center"
                >
                  Sign In
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}