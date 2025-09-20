export interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  image?: string
  category: string
}

export interface Stylist {
  id: string
  name: string
  title: string
  experience: string
  specialties: string[]
  rating: number
  avatar: string
  portfolio: string[]
  bio: string
  available: boolean
}

export interface TimeSlot {
  time: string
  available: boolean
  stylistId?: string
}

export interface BookingData {
  service?: Service
  stylist?: Stylist
  date?: string
  time?: string
  contactInfo?: {
    firstName: string
    lastName: string
    email: string
    phone: string
    notes?: string
  }
}

export interface BookingStep {
  id: number
  title: string
  description: string
  completed: boolean
}

export type BookingStepType = 'service' | 'stylist' | 'datetime' | 'contact' | 'confirmation'