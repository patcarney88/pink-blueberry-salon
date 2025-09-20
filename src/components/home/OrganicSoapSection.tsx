'use client'

import { useState } from 'react'
import { ShoppingCart, Heart, Eye, Star, Leaf, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  scent: string
  benefits: string[]
  rating: number
  reviews: number
  inStock: boolean
  recommended?: string[]
}

const products: Product[] = [
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Calming organic lavender soap with shea butter for ultimate relaxation.',
    price: 12.99,
    image: '🌸',
    scent: 'Lavender & Vanilla',
    benefits: ['Moisturizing', 'Calming', 'Anti-inflammatory'],
    rating: 4.9,
    reviews: 32,
    inStock: true,
    recommended: ['rose-garden', 'honey-oat']
  },
  {
    id: 'rose-garden',
    name: 'Rose Garden Bliss',
    description: 'Luxurious rose-infused soap with vitamin E for radiant skin.',
    price: 14.99,
    image: '🌹',
    scent: 'Rose & Geranium',
    benefits: ['Anti-aging', 'Hydrating', 'Brightening'],
    rating: 5.0,
    reviews: 28,
    inStock: true,
    recommended: ['lavender-dream', 'citrus-burst']
  },
  {
    id: 'honey-oat',
    name: 'Honey Oat Glow',
    description: 'Gentle exfoliating soap with organic honey and oatmeal.',
    price: 11.99,
    image: '🍯',
    scent: 'Honey & Almond',
    benefits: ['Exfoliating', 'Nourishing', 'Soothing'],
    rating: 4.8,
    reviews: 41,
    inStock: true,
    recommended: ['lavender-dream', 'mint-fresh']
  },
  {
    id: 'citrus-burst',
    name: 'Citrus Burst',
    description: 'Energizing blend of orange, lemon, and grapefruit essential oils.',
    price: 10.99,
    image: '🍊',
    scent: 'Citrus Medley',
    benefits: ['Energizing', 'Cleansing', 'Vitamin C'],
    rating: 4.7,
    reviews: 35,
    inStock: true,
    recommended: ['mint-fresh', 'rose-garden']
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    description: 'Cooling peppermint soap with tea tree oil for deep cleansing.',
    price: 11.99,
    image: '🌿',
    scent: 'Peppermint & Eucalyptus',
    benefits: ['Cooling', 'Antibacterial', 'Refreshing'],
    rating: 4.9,
    reviews: 29,
    inStock: true,
    recommended: ['citrus-burst', 'charcoal-detox']
  },
  {
    id: 'charcoal-detox',
    name: 'Charcoal Detox',
    description: 'Activated charcoal soap for deep pore cleansing and detoxification.',
    price: 13.99,
    image: '🖤',
    scent: 'Tea Tree & Sage',
    benefits: ['Detoxifying', 'Purifying', 'Acne-fighting'],
    rating: 4.8,
    reviews: 38,
    inStock: true,
    recommended: ['mint-fresh', 'honey-oat']
  }
]

export default function OrganicSoapSection() {
  const { addToCart } = useCart()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      type: 'product'
    })
  }

  return (
    <section className="relative py-20 bg-gradient-to-br from-white via-pink-50/30 to-blue-50/30 overflow-hidden">
      {/* Watercolor Background Effects */}
      <div className="absolute inset-0 -z-10">
        <svg
          className="absolute inset-0 w-full h-full opacity-5"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <filter id="watercolorSoap">
              <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" />
              <feColorMatrix type="saturate" values="1.5" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="#fce7f3" filter="url(#watercolorSoap)" />
        </svg>
      </div>

      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Leaf className="w-8 h-8 text-green-500" />
            <h2 className="text-5xl md:text-6xl font-light text-gray-900">
              Organic
              <span className="bg-gradient-to-r from-pink-600 via-amber-500 to-blue-600 bg-clip-text text-transparent font-bold font-[family-name:var(--font-dancing-script)] ml-3">
                Luxury Soaps
              </span>
            </h2>
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Handcrafted with love, our organic soaps combine natural ingredients
            with luxurious scents for the ultimate pampering experience
          </p>
        </motion.div>

        {/* Product Grid - Mobile Friendly */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
              className="relative group"
            >
              <div className="relative backdrop-blur-md bg-white/70 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                {/* Watercolor Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-100/20 via-transparent to-blue-100/20 opacity-50"></div>

                {/* Product Image Area */}
                <div className="relative h-48 bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
                  <div className="text-7xl transform group-hover:scale-110 transition-transform duration-500">
                    {product.image}
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute top-4 right-4 space-y-2">
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors duration-300"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          favorites.includes(product.id)
                            ? 'fill-pink-500 text-pink-500'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors duration-300"
                    >
                      <Eye className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Sale Badge */}
                  {index === 0 && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Bestseller
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="relative p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{product.scent}</p>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

                  {/* Benefits Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.benefits.slice(0, 2).map((benefit) => (
                      <span
                        key={benefit}
                        className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>

                  {/* Price and Add to Cart */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                      ${product.price}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all duration-300 font-semibold flex items-center space-x-2 group"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>

                  {/* Cross-sell Recommendations (shown on hover) */}
                  {hoveredProduct === product.id && product.recommended && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full left-0 right-0 bg-white rounded-t-2xl p-3 shadow-lg border border-gray-100 mb-2 mx-4"
                    >
                      <p className="text-xs text-gray-500 mb-2">Pairs well with:</p>
                      <div className="flex gap-2">
                        {product.recommended.slice(0, 2).map(recId => {
                          const recProduct = products.find(p => p.id === recId)
                          return recProduct ? (
                            <span
                              key={recId}
                              className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                            >
                              {recProduct.name}
                            </span>
                          ) : null
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 mb-6">
            All our soaps are handmade with 100% organic ingredients
          </p>
          <a
            href="/products"
            className="inline-flex items-center bg-gradient-to-r from-amber-500 to-amber-600 text-white px-10 py-5 rounded-full hover:shadow-xl transition-all duration-500 font-semibold text-lg group"
          >
            Shop All Products
            <ShoppingCart className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </motion.div>
      </div>

      {/* Product Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedProduct.name}</h3>
              <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
              <div className="space-y-3 mb-6">
                <p className="text-sm"><strong>Scent:</strong> {selectedProduct.scent}</p>
                <div>
                  <strong className="text-sm">Benefits:</strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProduct.benefits.map((benefit) => (
                      <span
                        key={benefit}
                        className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                  ${selectedProduct.price}
                </span>
                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct)
                    setSelectedProduct(null)
                  }}
                  className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300 font-semibold"
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}