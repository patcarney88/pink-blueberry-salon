'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types/product'
import { useShop } from '@/contexts/ShopContext'
import { Star, Heart, Eye, ShoppingCart, Check, Sparkles } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onQuickView?: (product: Product) => void
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart, addToWishlist, removeFromWishlist, isInCart, isInWishlist, getCartItemQuantity } = useShop()
  const [isHovered, setIsHovered] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddedToCart, setIsAddedToCart] = useState(false)

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]
  const secondaryImage = product.images.find(img => !img.isPrimary && !img.isLifestyle) || product.images[1]

  const inCart = isInCart(product.id)
  const inWishlist = isInWishlist(product.id)
  const cartQuantity = getCartItemQuantity(product.id)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsAddingToCart(true)

    // Simulate loading
    setTimeout(() => {
      addToCart(product)
      setIsAddingToCart(false)
      setIsAddedToCart(true)

      // Reset added state after animation
      setTimeout(() => {
        setIsAddedToCart(false)
      }, 2000)
    }, 500)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (inWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(product)
  }

  const discountAmount = product.originalPrice && product.price < product.originalPrice
    ? product.originalPrice - product.price
    : 0

  return (
    <div
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Badges */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
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
        {product.isOrganic && (
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Organic
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
        className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          inWishlist
            ? 'bg-pink-500 text-white scale-110'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-pink-500 hover:text-white'
        }`}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
      </button>

      {/* Product Image */}
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-50 to-blue-50">
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt}
            fill
            className={`object-cover transition-all duration-700 ${
              isHovered && secondaryImage ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Secondary Image for Hover Effect */}
          {secondaryImage && (
            <Image
              src={secondaryImage.url}
              alt={secondaryImage.alt}
              fill
              className={`object-cover transition-all duration-700 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}

          {/* Hover Overlay */}
          <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />

          {/* Quick Actions */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex space-x-3">
              <button
                onClick={handleQuickView}
                className="bg-white/90 backdrop-blur-sm text-gray-700 p-3 rounded-full hover:bg-white transition-colors duration-200"
                aria-label="Quick view"
              >
                <Eye className="w-5 h-5" />
              </button>

              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !product.inStock}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isAddingToCart
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : isAddedToCart
                    ? 'bg-green-500 text-white scale-110'
                    : product.inStock
                    ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                aria-label={isAddedToCart ? 'Added to cart' : 'Add to cart'}
              >
                {isAddingToCart ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : isAddedToCart ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Stock Status */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <span className="bg-gray-800 text-white px-4 py-2 rounded-lg font-medium">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-6">
        {/* Brand */}
        <p className="text-sm text-gray-500 mb-2">{product.brand}</p>

        {/* Product Name */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors duration-200 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Short Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.shortDescription}
        </p>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 ml-2">
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1 mb-4">
          {product.features.slice(0, 2).map((feature, index) => (
            <span
              key={index}
              className="text-xs bg-gradient-to-r from-pink-100 to-blue-100 text-gray-700 px-2 py-1 rounded-full"
            >
              {feature}
            </span>
          ))}
          {product.features.length > 2 && (
            <span className="text-xs text-gray-500">
              +{product.features.length - 2} more
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
              ${product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-lg text-gray-500 line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>

          {/* Cart Quantity Badge */}
          {cartQuantity > 0 && (
            <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {cartQuantity} in cart
            </div>
          )}
        </div>

        {/* Add to Cart Button (Mobile) */}
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || !product.inStock}
          className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all duration-200 md:hidden ${
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
              Adding...
            </div>
          ) : isAddedToCart ? (
            <div className="flex items-center justify-center">
              <Check className="w-5 h-5 mr-2" />
              Added to Cart
            </div>
          ) : product.inStock ? (
            'Add to Cart'
          ) : (
            'Out of Stock'
          )}
        </button>
      </div>
    </div>
  )
}