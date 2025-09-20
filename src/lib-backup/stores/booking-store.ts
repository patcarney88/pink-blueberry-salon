import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface Service {
  id: string
  name: string
  description: string
  duration: number // in minutes
  price: number
  category: string
}

export interface Staff {
  id: string
  name: string
  avatar?: string
  specialties: string[]
  availability: TimeSlot[]
}

export interface TimeSlot {
  date: string
  time: string
  available: boolean
}

export interface BookingDetails {
  service: Service | null
  staff: Staff | null
  date: string | null
  time: string | null
  notes?: string
}

interface BookingState {
  // Current Booking Flow
  currentStep: number
  bookingDetails: BookingDetails

  // Data
  services: Service[]
  staff: Staff[]
  availableSlots: TimeSlot[]

  // State
  isLoading: boolean
  error: string | null

  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void
  selectService: (service: Service) => void
  selectStaff: (staff: Staff) => void
  selectDateTime: (date: string, time: string) => void
  setNotes: (notes: string) => void
  resetBooking: () => void

  // Data Actions
  setServices: (services: Service[]) => void
  setStaff: (staff: Staff[]) => void
  setAvailableSlots: (slots: TimeSlot[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const initialBookingDetails: BookingDetails = {
  service: null,
  staff: null,
  date: null,
  time: null,
  notes: '',
}

export const useBookingStore = create<BookingState>()(
  devtools(
    immer((set) => ({
      // Initial State
      currentStep: 0,
      bookingDetails: initialBookingDetails,
      services: [],
      staff: [],
      availableSlots: [],
      isLoading: false,
      error: null,

      // Step Actions
      setStep: (step) =>
        set((state) => {
          state.currentStep = step
        }),

      nextStep: () =>
        set((state) => {
          state.currentStep += 1
        }),

      previousStep: () =>
        set((state) => {
          if (state.currentStep > 0) {
            state.currentStep -= 1
          }
        }),

      // Booking Actions
      selectService: (service) =>
        set((state) => {
          state.bookingDetails.service = service
        }),

      selectStaff: (staff) =>
        set((state) => {
          state.bookingDetails.staff = staff
        }),

      selectDateTime: (date, time) =>
        set((state) => {
          state.bookingDetails.date = date
          state.bookingDetails.time = time
        }),

      setNotes: (notes) =>
        set((state) => {
          state.bookingDetails.notes = notes
        }),

      resetBooking: () =>
        set((state) => {
          state.currentStep = 0
          state.bookingDetails = initialBookingDetails
          state.error = null
        }),

      // Data Actions
      setServices: (services) =>
        set((state) => {
          state.services = services
        }),

      setStaff: (staff) =>
        set((state) => {
          state.staff = staff
        }),

      setAvailableSlots: (slots) =>
        set((state) => {
          state.availableSlots = slots
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading
        }),

      setError: (error) =>
        set((state) => {
          state.error = error
          state.isLoading = false
        }),
    })),
    {
      name: 'BookingStore',
    }
  )
)