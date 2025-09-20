'use client'

import { Product } from '@/contexts/CartContext'
import { useCart } from '@/contexts/CartContext'
import { ShoppingCart } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()

  const handleAddToCart = () => {
    addToCart(product)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 group">
      {/* Product Image */}
      <div className="relative h-48 mb-4 bg-gradient-to-br from-pink-50 to-blue-50 rounded-lg flex items-center justify-center">
        <div className="text-6xl opacity-50">
          {product.category === 'Hair Care' ? '🧴' :
           product.category === 'Styling' ? '💅' : '✨'}
        </div>
        <div className="absolute top-2 right-2 bg-pink-600 text-white px-2 py-1 rounded-full text-xs font-medium">
          {product.category}
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
          {product.name}
        </h3>

        <p className="text-gray-600 text-sm line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-pink-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-pink-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 group"
        >
          <ShoppingCart className="h-4 w-4 group-hover:scale-110 transition-transform" />
          Add to Cart
        </button>
      </div>
    </div>
  )
}