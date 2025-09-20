'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Product } from '@/types/product'
import { useShop } from '@/contexts/ShopContext'
import { X, Star, Heart, ShoppingCart, Check, Plus, Minus, Sparkles } from 'lucide-react'

interface QuickViewModalProps {
  product: Product
  onClose: () => void
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useShop()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddedToCart, setIsAddedToCart] = useState(false)

  const inWishlist = isInWishlist(product.id)
  const discountAmount = product.originalPrice && product.price < product.originalPrice
    ? product.originalPrice - product.price
    : 0

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  const handleAddToCart = async () => {
    setIsAddingToCart(true)

    // Simulate loading
    setTimeout(() => {
      addToCart(product, quantity)
      setIsAddingToCart(false)
      setIsAddedToCart(true)

      // Reset added state after animation
      setTimeout(() => {
        setIsAddedToCart(false)
      }, 2000)
    }, 500)
  }

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-modalSlideIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Quick View</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl overflow-hidden">
              <Image
                src={product.images[selectedImageIndex].url}
                alt={product.images[selectedImageIndex].alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    New
                  </span>
                )}
                {product.isBestseller && (
                  <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Bestseller
                  </span>
                )}
                {discountAmount > 0 && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    ${discountAmount} Off
                  </span>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                onClick={handleWishlistToggle}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  inWishlist
                    ? 'bg-pink-500 text-white scale-110'
                    : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-pink-500 hover:text-white'
                }`}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? 'border-pink-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-600">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                ${product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xl text-gray-500 line-through">
                  ${product.originalPrice}
                </span>
              )}
              {discountAmount > 0 && (
                <span className="text-green-600 font-medium">
                  Save ${discountAmount}
                </span>
              )}
            </div>

            {/* Features */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
              <div className="flex flex-wrap gap-2">
                {product.features.map((feature, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-pink-100 to-blue-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                product.inStock ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className={`font-medium ${
                product.inStock ? 'text-green-700' : 'text-red-700'
              }`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
              {product.inStock && product.stockQuantity <= 5 && (
                <span className="text-orange-600 text-sm">
                  Only {product.stockQuantity} left!
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            {product.inStock && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 min-w-[60px] text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      className="p-2 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= product.stockQuantity}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.stockQuantity} available
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !product.inStock}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                  isAddingToCart
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : isAddedToCart
                    ? 'bg-green-500 text-white'
                    : product.inStock
                    ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isAddingToCart ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Adding to Cart...
                  </div>
                ) : isAddedToCart ? (
                  <div className="flex items-center justify-center">
                    <Check className="w-5 h-5 mr-2" />
                    Added to Cart!
                  </div>
                ) : product.inStock ? (
                  <div className="flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </div>
                ) : (
                  'Out of Stock'
                )}
              </button>

              <div className="text-center">
                <span className="text-sm text-gray-500">
                  Free shipping on orders over $75
                </span>
              </div>
            </div>

            {/* Product Reviews Summary */}
            {product.reviews.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Recent Review</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < product.reviews[0].rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-gray-900">
                      {product.reviews[0].customerName}
                    </span>
                    {product.reviews[0].verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {product.reviews[0].title}
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {product.reviews[0].comment}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-modalSlideIn {
          animation: modalSlideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}