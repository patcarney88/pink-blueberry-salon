'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Product, CartItem, WishlistItem } from '@/types/product'

interface ShopState {
  cartItems: CartItem[]
  wishlistItems: WishlistItem[]
  isCartOpen: boolean
  isLoading: boolean
  cartTotal: number
  cartItemCount: number
}

type ShopAction =
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity?: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'ADD_TO_WISHLIST'; payload: Product }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
  | { type: 'TOGGLE_CART'; payload?: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_FROM_STORAGE'; payload: Partial<ShopState> }

const initialState: ShopState = {
  cartItems: [],
  wishlistItems: [],
  isCartOpen: false,
  isLoading: false,
  cartTotal: 0,
  cartItemCount: 0,
}

function shopReducer(state: ShopState, action: ShopAction): ShopState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, quantity = 1 } = action.payload
      const existingItem = state.cartItems.find(item => item.product.id === product.id)

      let newCartItems: CartItem[]
      if (existingItem) {
        newCartItems = state.cartItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        const newItem: CartItem = {
          product,
          quantity,
          addedAt: new Date().toISOString()
        }
        newCartItems = [...state.cartItems, newItem]
      }

      const cartTotal = newCartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      const cartItemCount = newCartItems.reduce((sum, item) => sum + item.quantity, 0)

      return {
        ...state,
        cartItems: newCartItems,
        cartTotal,
        cartItemCount
      }
    }

    case 'REMOVE_FROM_CART': {
      const newCartItems = state.cartItems.filter(item => item.product.id !== action.payload)
      const cartTotal = newCartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      const cartItemCount = newCartItems.reduce((sum, item) => sum + item.quantity, 0)

      return {
        ...state,
        cartItems: newCartItems,
        cartTotal,
        cartItemCount
      }
    }

    case 'UPDATE_CART_QUANTITY': {
      const { productId, quantity } = action.payload
      if (quantity <= 0) {
        return shopReducer(state, { type: 'REMOVE_FROM_CART', payload: productId })
      }

      const newCartItems = state.cartItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )

      const cartTotal = newCartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      const cartItemCount = newCartItems.reduce((sum, item) => sum + item.quantity, 0)

      return {
        ...state,
        cartItems: newCartItems,
        cartTotal,
        cartItemCount
      }
    }

    case 'CLEAR_CART':
      return {
        ...state,
        cartItems: [],
        cartTotal: 0,
        cartItemCount: 0,
        isCartOpen: false
      }

    case 'ADD_TO_WISHLIST': {
      const product = action.payload
      const existingItem = state.wishlistItems.find(item => item.product.id === product.id)

      if (existingItem) {
        return state // Already in wishlist
      }

      const newWishlistItem: WishlistItem = {
        product,
        addedAt: new Date().toISOString()
      }

      return {
        ...state,
        wishlistItems: [...state.wishlistItems, newWishlistItem]
      }
    }

    case 'REMOVE_FROM_WISHLIST':
      return {
        ...state,
        wishlistItems: state.wishlistItems.filter(item => item.product.id !== action.payload)
      }

    case 'TOGGLE_CART':
      return {
        ...state,
        isCartOpen: action.payload !== undefined ? action.payload : !state.isCartOpen
      }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }

    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        ...action.payload
      }

    default:
      return state
  }
}

interface ShopContextType {
  state: ShopState
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  toggleCart: (open?: boolean) => void
  isInCart: (productId: string) => boolean
  isInWishlist: (productId: string) => boolean
  getCartItemQuantity: (productId: string) => number
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'pinkBlueberryCart'
const WISHLIST_STORAGE_KEY = 'pinkBlueberryWishlist'

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(shopReducer, initialState)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY)

      const cartItems = savedCart ? JSON.parse(savedCart) : []
      const wishlistItems = savedWishlist ? JSON.parse(savedWishlist) : []

      if (cartItems.length > 0 || wishlistItems.length > 0) {
        const cartTotal = cartItems.reduce((sum: number, item: CartItem) =>
          sum + (item.product.price * item.quantity), 0)
        const cartItemCount = cartItems.reduce((sum: number, item: CartItem) =>
          sum + item.quantity, 0)

        dispatch({
          type: 'LOAD_FROM_STORAGE',
          payload: {
            cartItems,
            wishlistItems,
            cartTotal,
            cartItemCount
          }
        })
      }
    } catch (error) {
      console.error('Failed to load shop data from storage:', error)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cartItems))
    } catch (error) {
      console.error('Failed to save cart to storage:', error)
    }
  }, [state.cartItems])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state.wishlistItems))
    } catch (error) {
      console.error('Failed to save wishlist to storage:', error)
    }
  }, [state.wishlistItems])

  const addToCart = (product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } })
  }

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId })
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const addToWishlist = (product: Product) => {
    dispatch({ type: 'ADD_TO_WISHLIST', payload: product })
  }

  const removeFromWishlist = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: productId })
  }

  const toggleCart = (open?: boolean) => {
    dispatch({ type: 'TOGGLE_CART', payload: open })
  }

  const isInCart = (productId: string): boolean => {
    return state.cartItems.some(item => item.product.id === productId)
  }

  const isInWishlist = (productId: string): boolean => {
    return state.wishlistItems.some(item => item.product.id === productId)
  }

  const getCartItemQuantity = (productId: string): number => {
    const item = state.cartItems.find(item => item.product.id === productId)
    return item ? item.quantity : 0
  }

  const value: ShopContextType = {
    state,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    toggleCart,
    isInCart,
    isInWishlist,
    getCartItemQuantity,
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const context = useContext(ShopContext)
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider')
  }
  return context
}