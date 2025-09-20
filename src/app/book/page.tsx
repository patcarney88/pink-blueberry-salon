import { BookingProvider } from '@/contexts/BookingContext'
import BookingFlow from '@/components/booking/BookingFlow'

export default function BookPage() {
  return (
    <BookingProvider>
      <main>
        <BookingFlow />
      </main>
    </BookingProvider>
  )
}