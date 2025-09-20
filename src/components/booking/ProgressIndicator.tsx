'use client'

import { useBooking } from '@/contexts/BookingContext'
import { Check } from 'lucide-react'

const steps = [
  { id: 1, title: 'Service', description: 'Choose your service' },
  { id: 2, title: 'Stylist', description: 'Select your stylist' },
  { id: 3, title: 'Date & Time', description: 'Pick your slot' },
  { id: 4, title: 'Contact', description: 'Your details' },
  { id: 5, title: 'Confirm', description: 'Review booking' },
]

export default function ProgressIndicator() {
  const { state, isStepCompleted, canProceedToStep, goToStep } = useBooking()

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Mobile Progress Bar */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {state.currentStep} of 5
          </span>
          <span className="text-sm text-gray-500">
            {steps[state.currentStep - 1]?.title}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-pink-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(state.currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = state.currentStep === step.id
          const isCompleted = isStepCompleted(step.id)
          const canAccess = canProceedToStep(step.id)
          const isClickable = canAccess && step.id !== state.currentStep

          return (
            <div key={step.id} className="flex items-center relative">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && goToStep(step.id)}
                disabled={!isClickable}
                className={`
                  relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300 font-semibold text-sm
                  ${isActive
                    ? 'bg-gradient-to-r from-pink-500 to-blue-500 border-transparent text-white shadow-lg scale-110'
                    : isCompleted
                    ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                    : canAccess
                    ? 'bg-white border-gray-300 text-gray-600 hover:border-pink-300 hover:text-pink-600'
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                  }
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
                aria-label={`${step.title} - ${isCompleted ? 'Completed' : isActive ? 'Current step' : 'Not yet accessible'}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{step.id}</span>
                )}
              </button>

              {/* Step Label */}
              <div className="absolute top-14 left-1/2 transform -translate-x-1/2 text-center min-w-[80px]">
                <div className={`
                  font-medium text-sm transition-colors duration-300
                  ${isActive
                    ? 'text-pink-600'
                    : isCompleted
                    ? 'text-green-600'
                    : canAccess
                    ? 'text-gray-700'
                    : 'text-gray-400'
                  }
                `}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {step.description}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 relative">
                  <div className="absolute inset-0 bg-gray-200 rounded-full" />
                  <div
                    className={`
                      absolute inset-0 rounded-full transition-all duration-500
                      ${isCompleted
                        ? 'bg-gradient-to-r from-green-500 to-green-500'
                        : isActive && index === state.currentStep - 1
                        ? 'bg-gradient-to-r from-pink-500 to-blue-500'
                        : 'bg-gray-200'
                      }
                    `}
                    style={{
                      width: isCompleted ? '100%' : isActive && index === state.currentStep - 1 ? '50%' : '0%'
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{state.error}</p>
        </div>
      )}
    </div>
  )
}