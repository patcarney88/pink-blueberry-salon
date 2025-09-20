'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Star, Plus } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import CartIcon from '@/components/cart/CartIcon'

const products = [
  {
    id: '1',
    name: 'Luxury Hair Serum',
    price: 45,
    description: 'Professional-grade serum for silky smooth hair',
    image: '✨',
    category: 'Hair Care'
  },
  {
    id: '2',
    name: 'Moisturizing Shampoo',
    price: 28,
    description: 'Sulfate-free formula for all hair types',
    image: '🧴',
    category: 'Hair Care'
  },
  {
    id: '3',
    name: 'Deep Conditioning Mask',
    price: 35,
    description: 'Intensive treatment for damaged hair',
    image: '💆‍♀️',
    category: 'Hair Care'
  },
  {
    id: '4',
    name: 'Color Protect Conditioner',
    price: 32,
    description: 'Keeps your color vibrant longer',
    image: '🌈',
    category: 'Hair Care'
  },
  {
    id: '5',
    name: 'Volumizing Spray',
    price: 26,
    description: 'Adds body and lift to fine hair',
    image: '💨',
    category: 'Styling'
  },
  {
    id: '6',
    name: 'Heat Protectant',
    price: 24,
    description: 'Shield your hair from heat damage',
    image: '🛡️',
    category: 'Styling'
  },
  {
    id: '7',
    name: 'Luxury Face Cream',
    price: 65,
    description: 'Anti-aging formula with natural ingredients',
    image: '🌸',
    category: 'Skin Care'
  },
  {
    id: '8',
    name: 'Hydrating Face Mask',
    price: 38,
    description: 'Intensive moisture for glowing skin',
    image: '✨',
    category: 'Skin Care'
  }
]

export default function ShopPage() {
  const { addToCart, getTotalItems } = useCart()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [addedToCart, setAddedToCart] = useState<string | null>(null)

  const categories = ['All', 'Hair Care', 'Styling', 'Skin Care']

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory)

  const handleAddToCart = (product: any) => {
    addToCart(product)
    setAddedToCart(product.id)
    setTimeout(() => setAddedToCart(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/20 to-blue-50/20">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-gray-200/20 shadow-sm">
        <div className="container mx-auto px-6 py-5">
          <nav className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center text-gray-700 hover:text-pink-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back to Home</span>
            </Link>

            <h1 className="text-2xl font-playfair font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
              Beauty Shop
            </h1>

            <CartIcon />
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">
            Premium Beauty
            <span className="block text-5xl md:text-6xl font-bold font-playfair bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Products
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional-grade products to maintain your salon-perfect look at home
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg'
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-2"
            >
              {/* Product Image/Emoji */}
              <div className="h-48 bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                {product.image}
              </div>

              {/* Product Details */}
              <div className="p-6">
                <div className="mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    {product.category}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  {product.description}
                </p>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs text-gray-500 ml-2">(4.9)</span>
                </div>

                {/* Price and Add to Cart */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                    ${product.price}
                  </span>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                      addedToCart === product.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-pink-500 to-blue-500 text-white hover:shadow-lg'
                    }`}
                  >
                    {addedToCart === product.id ? (
                      <span className="flex items-center">
                        ✓ Added
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Free Shipping Banner */}
        <div className="mt-16 bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl p-8 text-center border border-amber-200">
          <h3 className="text-2xl font-bold text-amber-900 mb-2">
            ✨ Free Shipping on Orders Over $75 ✨
          </h3>
          <p className="text-amber-700">
            Get your favorite products delivered right to your door
          </p>
        </div>
      </div>
    </div>
  )
}