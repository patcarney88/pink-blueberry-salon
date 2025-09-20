'use client'

import { useState, useEffect } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { TimeSlot } from '@/types/booking'
import { ChevronLeft, ChevronRight, Calendar, Clock, Check } from 'lucide-react'

// Generate available time slots
const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const isWeekend = date.getDay() === 0 || date.getDay() === 6
  const startHour = isWeekend ? 10 : 9
  const endHour = isWeekend ? 17 : 20

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      // Simulate some unavailable slots
      const available = Math.random() > 0.3
      slots.push({
        time: timeString,
        available,
      })
    }
  }
  return slots
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTime = (time: string): string => {
  const [hour, minute] = time.split(':')
  const hourNum = parseInt(hour)
  const ampm = hourNum >= 12 ? 'PM' : 'AM'
  const displayHour = hourNum % 12 || 12
  return `${displayHour}:${minute} ${ampm}`
}

export default function DateTimeSelection() {
  const { state, setDateTime, nextStep, prevStep } = useBooking()
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    state.bookingData.date ? new Date(state.bookingData.date) : null
  )
  const [selectedTime, setSelectedTime] = useState<string | null>(state.bookingData.time || null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  // Get calendar dates
  const today = new Date()
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const firstDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  // Generate calendar grid
  const calendarDays = []

  // Previous month's trailing days
  const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0)
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, prevMonth.getDate() - i),
      isCurrentMonth: false,
      isToday: false,
      isSelectable: false
    })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const isToday = date.toDateString() === today.toDateString()
    const isSelectable = date >= today && date <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // Next 30 days

    calendarDays.push({
      date,
      isCurrentMonth: true,
      isToday,
      isSelectable
    })
  }

  // Next month's leading days to fill the grid
  const remainingDays = 42 - calendarDays.length // 6 weeks × 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day),
      isCurrentMonth: false,
      isToday: false,
      isSelectable: false
    })
  }

  // Load time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      setIsLoadingSlots(true)
      setSelectedTime(null)

      // Simulate API call
      setTimeout(() => {
        setTimeSlots(generateTimeSlots(selectedDate))
        setIsLoadingSlots(false)
      }, 800)
    }
  }, [selectedDate])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      setDateTime(selectedDate.toISOString().split('T')[0], selectedTime)
      nextStep()
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + (direction === 'next' ? 1 : -1)))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-light text-gray-900 mb-4">Choose Date & Time</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Select your preferred appointment date and time. We'll show you available slots with your chosen stylist.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-pink-500" />
              Select Date
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-lg font-medium text-gray-700 min-w-[140px] text-center">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const isSelected = selectedDate?.toDateString() === day.date.toDateString()

              return (
                <button
                  key={index}
                  onClick={() => day.isSelectable && handleDateSelect(day.date)}
                  disabled={!day.isSelectable}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded-lg transition-all duration-200
                    ${!day.isCurrentMonth
                      ? 'text-gray-300 cursor-default'
                      : day.isSelectable
                      ? isSelected
                        ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg scale-110'
                        : day.isToday
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                      : 'text-gray-300 cursor-not-allowed'
                    }
                  `}
                  aria-label={`${day.isSelectable ? 'Select' : 'Unavailable'} ${day.date.toLocaleDateString()}`}
                >
                  {day.date.getDate()}
                </button>
              )
            })}
          </div>

          {selectedDate && (
            <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-blue-50 rounded-lg">
              <p className="text-gray-700 font-medium">Selected Date:</p>
              <p className="text-lg text-gray-900">{formatDate(selectedDate)}</p>
            </div>
          )}
        </div>

        {/* Time Slots */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <Clock className="w-5 h-5 mr-2 text-pink-500" />
            <h3 className="text-xl font-semibold text-gray-900">Select Time</h3>
          </div>

          {!selectedDate ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Please select a date first</p>
            </div>
          ) : isLoadingSlots ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Loading available times...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Morning */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Morning</h4>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.filter(slot => {
                    const hour = parseInt(slot.time.split(':')[0])
                    return hour < 12
                  }).map((slot) => {
                    const isSelected = selectedTime === slot.time

                    return (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && handleTimeSelect(slot.time)}
                        disabled={!slot.available}
                        className={`
                          py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${!slot.available
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg scale-105'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                          }
                        `}
                        aria-label={`${slot.available ? 'Select' : 'Unavailable'} ${formatTime(slot.time)}`}
                      >
                        {formatTime(slot.time)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Afternoon */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Afternoon</h4>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.filter(slot => {
                    const hour = parseInt(slot.time.split(':')[0])
                    return hour >= 12 && hour < 17
                  }).map((slot) => {
                    const isSelected = selectedTime === slot.time

                    return (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && handleTimeSelect(slot.time)}
                        disabled={!slot.available}
                        className={`
                          py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${!slot.available
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg scale-105'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                          }
                        `}
                        aria-label={`${slot.available ? 'Select' : 'Unavailable'} ${formatTime(slot.time)}`}
                      >
                        {formatTime(slot.time)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Evening */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Evening</h4>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.filter(slot => {
                    const hour = parseInt(slot.time.split(':')[0])
                    return hour >= 17
                  }).map((slot) => {
                    const isSelected = selectedTime === slot.time

                    return (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && handleTimeSelect(slot.time)}
                        disabled={!slot.available}
                        className={`
                          py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${!slot.available
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg scale-105'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                          }
                        `}
                        aria-label={`${slot.available ? 'Select' : 'Unavailable'} ${formatTime(slot.time)}`}
                      >
                        {formatTime(slot.time)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedTime && (
                <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-blue-50 rounded-lg">
                  <p className="text-gray-700 font-medium">Selected Time:</p>
                  <p className="text-lg text-gray-900">{formatTime(selectedTime)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-12 flex justify-between">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Stylist</span>
        </button>

        {selectedDate && selectedTime && (
          <button
            onClick={handleContinue}
            className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-12 py-4 rounded-2xl hover:shadow-xl transition-all duration-300 font-semibold text-lg inline-flex items-center space-x-2"
          >
            <span>Continue to Contact Info</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}