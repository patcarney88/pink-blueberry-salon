'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useShop } from '@/contexts/ShopContext'
import { X, Plus, Minus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'

export default function CartDrawer() {
  const {
    state,
    toggleCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
  } = useShop()

  const { isCartOpen, cartItems, cartTotal, cartItemCount } = state

  // Close cart on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        toggleCart(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isCartOpen, toggleCart])

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isCartOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      toggleCart(false)
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      updateCartQuantity(productId, newQuantity)
    }
  }

  const subtotal = cartTotal
  const shipping = cartTotal > 75 ? 0 : 10
  const tax = cartTotal * 0.08
  const total = subtotal + shipping + tax

  if (!isCartOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 transition-opacity duration-300" />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-pink-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Shopping Cart ({cartItemCount})
            </h2>
          </div>
          <button
            onClick={() => toggleCart(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your cart is empty
              </h3>
              <p className="text-gray-600 mb-6">
                Add some products to get started
              </p>
              <button
                onClick={() => toggleCart(false)}
                className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {cartItems.map((item) => {
                const primaryImage = item.product.images.find(img => img.isPrimary) || item.product.images[0]

                return (
                  <div key={item.product.id} className="flex space-x-4 group">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 bg-gradient-to-br from-pink-50 to-blue-50 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm leading-5 mb-1">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        {item.product.brand}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 transition-colors"
                            disabled={item.quantity >= item.product.stockQuantity}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-xs text-gray-500">
                          ${item.product.price} each
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Clear Cart Button */}
              {cartItems.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={clearCart}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Clear all items
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            {/* Order Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `$${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Free Shipping Notice */}
            {shipping > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Add ${(75 - cartTotal).toFixed(2)} more for free shipping!
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/checkout"
                onClick={() => toggleCart(false)}
                className="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white py-3 px-4 rounded-xl font-semibold text-center hover:shadow-lg transition-shadow flex items-center justify-center"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>

              <button
                onClick={() => toggleCart(false)}
                className="w-full bg-white text-gray-700 py-3 px-4 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </button>
            </div>

            {/* Security Notice */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                🔒 Secure checkout • Free returns • 30-day guarantee
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}