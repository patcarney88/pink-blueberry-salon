'use client'

import Link from 'next/link'
import CartIcon from '@/components/cart/CartIcon'

export default function Header() {
  return (
    <header className="container mx-auto px-4 py-6">
      <nav className="flex items-center justify-between">
        <div className="text-2xl font-bold text-gray-900">
          🌸 Pink Blueberry Salon
        </div>
        <div className="hidden md:flex space-x-6 items-center">
          <Link href="/booking" className="text-gray-600 hover:text-pink-600 transition-colors">
            Book Now
          </Link>
          <Link href="/products" className="text-gray-600 hover:text-pink-600 transition-colors">
            Products
          </Link>
          <Link href="/services" className="text-gray-600 hover:text-pink-600 transition-colors">
            Services
          </Link>
          <Link href="/dashboard" className="text-gray-600 hover:text-pink-600 transition-colors">
            Dashboard
          </Link>
          <CartIcon />
          <Link href="/auth/signin" className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors">
            Sign In
          </Link>
        </div>

        {/* Mobile Menu (simplified) */}
        <div className="md:hidden flex items-center space-x-4">
          <CartIcon />
          <Link href="/auth/signin" className="bg-pink-600 text-white px-3 py-2 rounded-lg text-sm">
            Sign In
          </Link>
        </div>
      </nav>
    </header>
  )
}