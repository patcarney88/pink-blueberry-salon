'use client'

import { useShop } from '@/contexts/ShopContext'
import { ShoppingBag } from 'lucide-react'

export default function CartIcon() {
  const { state, toggleCart } = useShop()
  const { cartItemCount } = state

  return (
    <button
      onClick={() => toggleCart(true)}
      className="relative p-2 text-gray-600 hover:text-pink-600 transition-colors"
      aria-label={`Shopping cart with ${cartItemCount} items`}
    >
      <ShoppingBag className="w-6 h-6" />

      {/* Cart Count Badge */}
      {cartItemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {cartItemCount > 99 ? '99+' : cartItemCount}
        </span>
      )}
    </button>
  )
}