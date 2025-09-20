'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { BookingData, BookingStepType } from '@/types/booking'

interface BookingState {
  currentStep: number
  bookingData: BookingData
  isLoading: boolean
  error: string | null
}

type BookingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_SERVICE'; payload: BookingData['service'] }
  | { type: 'SET_STYLIST'; payload: BookingData['stylist'] }
  | { type: 'SET_DATETIME'; payload: { date: string; time: string } }
  | { type: 'SET_CONTACT_INFO'; payload: BookingData['contactInfo'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_BOOKING' }
  | { type: 'LOAD_FROM_STORAGE'; payload: BookingState }
  | { type: 'CONFIRM_BOOKING' }

const initialState: BookingState = {
  currentStep: 1,
  bookingData: {},
  isLoading: false,
  error: null,
}

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    case 'SET_SERVICE':
      return {
        ...state,
        bookingData: { ...state.bookingData, service: action.payload },
        error: null
      }
    case 'SET_STYLIST':
      return {
        ...state,
        bookingData: { ...state.bookingData, stylist: action.payload },
        error: null
      }
    case 'SET_DATETIME':
      return {
        ...state,
        bookingData: {
          ...state.bookingData,
          date: action.payload.date,
          time: action.payload.time
        },
        error: null
      }
    case 'SET_CONTACT_INFO':
      return {
        ...state,
        bookingData: { ...state.bookingData, contactInfo: action.payload },
        error: null
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'RESET_BOOKING':
      return initialState
    case 'LOAD_FROM_STORAGE':
      return action.payload
    case 'CONFIRM_BOOKING':
      return { ...state, isLoading: false, error: null }
    default:
      return state
  }
}

interface BookingContextType {
  state: BookingState
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  setService: (service: BookingData['service']) => void
  setStylist: (stylist: BookingData['stylist']) => void
  setDateTime: (date: string, time: string) => void
  setContactInfo: (info: BookingData['contactInfo']) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetBooking: () => void
  confirmBooking: () => void
  isStepCompleted: (step: number) => boolean
  canProceedToStep: (step: number) => boolean
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

const STORAGE_KEY = 'pinkBlueberryBooking'

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsedState = JSON.parse(saved)
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsedState })
      }
    } catch (error) {
      console.error('Failed to load booking from storage:', error)
    }
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save booking to storage:', error)
    }
  }, [state])

  const nextStep = () => {
    if (state.currentStep < 5) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 })
    }
  }

  const prevStep = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 })
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5 && canProceedToStep(step)) {
      dispatch({ type: 'SET_STEP', payload: step })
    }
  }

  const setService = (service: BookingData['service']) => {
    dispatch({ type: 'SET_SERVICE', payload: service })
  }

  const setStylist = (stylist: BookingData['stylist']) => {
    dispatch({ type: 'SET_STYLIST', payload: stylist })
  }

  const setDateTime = (date: string, time: string) => {
    dispatch({ type: 'SET_DATETIME', payload: { date, time } })
  }

  const setContactInfo = (info: BookingData['contactInfo']) => {
    dispatch({ type: 'SET_CONTACT_INFO', payload: info })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const resetBooking = () => {
    dispatch({ type: 'RESET_BOOKING' })
    localStorage.removeItem(STORAGE_KEY)
  }

  const confirmBooking = () => {
    dispatch({ type: 'CONFIRM_BOOKING' })
    // Here you would typically make an API call to confirm the booking
    console.log('Booking confirmed:', state.bookingData)
  }

  const isStepCompleted = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!state.bookingData.service
      case 2:
        return !!state.bookingData.stylist
      case 3:
        return !!state.bookingData.date && !!state.bookingData.time
      case 4:
        return !!state.bookingData.contactInfo?.firstName &&
               !!state.bookingData.contactInfo?.lastName &&
               !!state.bookingData.contactInfo?.email &&
               !!state.bookingData.contactInfo?.phone
      case 5:
        return isStepCompleted(1) && isStepCompleted(2) &&
               isStepCompleted(3) && isStepCompleted(4)
      default:
        return false
    }
  }

  const canProceedToStep = (step: number): boolean => {
    if (step === 1) return true
    if (step === 2) return isStepCompleted(1)
    if (step === 3) return isStepCompleted(1) && isStepCompleted(2)
    if (step === 4) return isStepCompleted(1) && isStepCompleted(2) && isStepCompleted(3)
    if (step === 5) return isStepCompleted(1) && isStepCompleted(2) &&
                          isStepCompleted(3) && isStepCompleted(4)
    return false
  }

  const value: BookingContextType = {
    state,
    nextStep,
    prevStep,
    goToStep,
    setService,
    setStylist,
    setDateTime,
    setContactInfo,
    setLoading,
    setError,
    resetBooking,
    confirmBooking,
    isStepCompleted,
    canProceedToStep,
  }

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
}