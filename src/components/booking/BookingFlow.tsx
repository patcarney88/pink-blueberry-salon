'use client'

import { useBooking } from '@/contexts/BookingContext'
import ProgressIndicator from './ProgressIndicator'
import ServiceSelection from './steps/ServiceSelection'
import StylistSelection from './steps/StylistSelection'
import DateTimeSelection from './steps/DateTimeSelection'
import ContactInfo from './steps/ContactInfo'
import Confirmation from './steps/Confirmation'

export default function BookingFlow() {
  const { state } = useBooking()

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <ServiceSelection />
      case 2:
        return <StylistSelection />
      case 3:
        return <DateTimeSelection />
      case 4:
        return <ContactInfo />
      case 5:
        return <Confirmation />
      default:
        return <ServiceSelection />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <ProgressIndicator />

        {/* Current Step Content */}
        <div className="animate-fadeIn">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}