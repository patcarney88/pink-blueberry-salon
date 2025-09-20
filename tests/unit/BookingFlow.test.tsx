/**
 * Unit Tests for BookingFlow Component
 * Tests individual component functionality and state management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { BookingProvider, useBooking } from '@/contexts/BookingContext';
import { createMockService, createMockStylist, mockApiResponse } from '../setup';

// Mock the booking context
jest.mock('@/contexts/BookingContext', () => ({
  ...jest.requireActual('@/contexts/BookingContext'),
  useBooking: jest.fn(),
}));

// Mock API calls
beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

describe('BookingFlow Component', () => {
  const mockBookingContext = {
    selectedServices: [],
    selectedStylist: null,
    selectedDate: null,
    selectedTime: null,
    customerInfo: null,
    currentStep: 1,
    setSelectedServices: jest.fn(),
    setSelectedStylist: jest.fn(),
    setSelectedDate: jest.fn(),
    setSelectedTime: jest.fn(),
    setCustomerInfo: jest.fn(),
    setCurrentStep: jest.fn(),
    resetBooking: jest.fn(),
    calculateTotal: jest.fn(() => ({ price: 0, duration: 0 })),
  };

  beforeEach(() => {
    (useBooking as jest.Mock).mockReturnValue(mockBookingContext);
  });

  describe('Service Selection Step', () => {
    it('displays available services', async () => {
      const services = [
        createMockService({ id: '1', name: 'Hair Color' }),
        createMockService({ id: '2', name: 'Hair Cut' }),
        createMockService({ id: '3', name: 'Highlights' }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ services })
      );

      render(<BookingFlow />);

      await waitFor(() => {
        expect(screen.getByText('Hair Color')).toBeInTheDocument();
        expect(screen.getByText('Hair Cut')).toBeInTheDocument();
        expect(screen.getByText('Highlights')).toBeInTheDocument();
      });
    });

    it('allows selecting multiple services', async () => {
      const user = userEvent.setup();
      const setSelectedServices = jest.fn();

      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        setSelectedServices,
      });

      render(<BookingFlow />);

      const hairColorCard = screen.getByTestId('service-hair-color');
      const hairCutCard = screen.getByTestId('service-hair-cut');

      await user.click(hairColorCard);
      expect(setSelectedServices).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Hair Color' }),
        ])
      );

      await user.click(hairCutCard);
      expect(setSelectedServices).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Hair Color' }),
          expect.objectContaining({ name: 'Hair Cut' }),
        ])
      );
    });

    it('calculates total price and duration', async () => {
      const services = [
        createMockService({ name: 'Hair Color', price: 150, duration: 120 }),
        createMockService({ name: 'Hair Cut', price: 65, duration: 45 }),
      ];

      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        selectedServices: services,
        calculateTotal: jest.fn(() => ({ price: 215, duration: 165 })),
      });

      render(<BookingFlow />);

      expect(screen.getByText('Total: $215')).toBeInTheDocument();
      expect(screen.getByText('Duration: 2h 45min')).toBeInTheDocument();
    });

    it('validates service selection before continuing', async () => {
      const user = userEvent.setup();

      render(<BookingFlow />);

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();

      // Select a service
      const serviceCard = screen.getByTestId('service-hair-color');
      await user.click(serviceCard);

      expect(continueButton).toBeEnabled();
    });
  });

  describe('Stylist Selection Step', () => {
    beforeEach(() => {
      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        currentStep: 2,
        selectedServices: [createMockService()],
      });
    });

    it('displays available stylists', async () => {
      const stylists = [
        createMockStylist({ id: '1', name: 'Beth Day' }),
        createMockStylist({ id: '2', name: 'Sarah Johnson' }),
        createMockStylist({ id: '3', name: 'Mike Chen' }),
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ stylists })
      );

      render(<BookingFlow />);

      await waitFor(() => {
        expect(screen.getByText('Beth Day')).toBeInTheDocument();
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
        expect(screen.getByText('Mike Chen')).toBeInTheDocument();
      });
    });

    it('shows stylist specialties and availability', async () => {
      const stylist = createMockStylist({
        name: 'Beth Day',
        specialties: ['Color Specialist', 'Bridal Styling'],
        nextAvailable: '2024-12-15T10:00:00Z',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ stylists: [stylist] })
      );

      render(<BookingFlow />);

      await waitFor(() => {
        expect(screen.getByText('Color Specialist')).toBeInTheDocument();
        expect(screen.getByText('Bridal Styling')).toBeInTheDocument();
        expect(screen.getByText(/next available/i)).toBeInTheDocument();
      });
    });

    it('allows selecting a stylist', async () => {
      const user = userEvent.setup();
      const setSelectedStylist = jest.fn();

      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        currentStep: 2,
        setSelectedStylist,
      });

      render(<BookingFlow />);

      const stylistCard = screen.getByTestId('stylist-beth-day');
      await user.click(stylistCard);

      expect(setSelectedStylist).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Beth Day' })
      );
    });
  });

  describe('Date & Time Selection Step', () => {
    beforeEach(() => {
      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        currentStep: 3,
        selectedServices: [createMockService()],
        selectedStylist: createMockStylist(),
      });
    });

    it('displays calendar with available dates', async () => {
      render(<BookingFlow />);

      const calendar = screen.getByTestId('booking-calendar');
      expect(calendar).toBeInTheDocument();

      // Check for current month
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(screen.getByText(currentMonth)).toBeInTheDocument();
    });

    it('shows available time slots for selected date', async () => {
      const user = userEvent.setup();
      const availableSlots = ['9:00 AM', '10:00 AM', '2:00 PM', '3:00 PM'];

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ availableSlots })
      );

      render(<BookingFlow />);

      // Select a date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateButton = screen.getByTestId(`date-${tomorrow.getDate()}`);
      await user.click(dateButton);

      await waitFor(() => {
        availableSlots.forEach(slot => {
          expect(screen.getByText(slot)).toBeInTheDocument();
        });
      });
    });

    it('blocks unavailable time slots', async () => {
      const slots = [
        { time: '9:00 AM', available: true },
        { time: '10:00 AM', available: false },
        { time: '11:00 AM', available: false },
        { time: '2:00 PM', available: true },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({ slots })
      );

      render(<BookingFlow />);

      await waitFor(() => {
        const unavailableSlot = screen.getByTestId('slot-10:00 AM');
        expect(unavailableSlot).toHaveAttribute('disabled');
        expect(unavailableSlot).toHaveClass('opacity-50');
      });
    });

    it('validates date and time selection', async () => {
      const user = userEvent.setup();

      render(<BookingFlow />);

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();

      // Select date and time
      const dateButton = screen.getByTestId('date-15');
      await user.click(dateButton);

      const timeSlot = screen.getByTestId('slot-2:00 PM');
      await user.click(timeSlot);

      expect(continueButton).toBeEnabled();
    });
  });

  describe('Contact Information Step', () => {
    beforeEach(() => {
      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        currentStep: 4,
        selectedServices: [createMockService()],
        selectedStylist: createMockStylist(),
        selectedDate: '2024-12-15',
        selectedTime: '14:00',
      });
    });

    it('displays contact form fields', () => {
      render(<BookingFlow />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();

      render(<BookingFlow />);

      const submitButton = screen.getByRole('button', { name: /book appointment/i });
      await user.click(submitButton);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Phone is required')).toBeInTheDocument();
    });

    it('validates email format', async () => {
      const user = userEvent.setup();

      render(<BookingFlow />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /book appointment/i });
      await user.click(submitButton);

      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });

    it('validates phone format', async () => {
      const user = userEvent.setup();

      render(<BookingFlow />);

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, '123');

      const submitButton = screen.getByRole('button', { name: /book appointment/i });
      await user.click(submitButton);

      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });

    it('submits booking successfully', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockApiResponse({
          success: true,
          bookingId: 'BOOK123',
          message: 'Booking confirmed',
        })
      );

      render(<BookingFlow />);

      await user.type(screen.getByLabelText(/name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
      await user.type(screen.getByLabelText(/phone/i), '555-0123');
      await user.type(screen.getByLabelText(/notes/i), 'First time customer');

      const submitButton = screen.getByRole('button', { name: /book appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/appointments',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              services: expect.any(Array),
              stylist: expect.any(Object),
              date: '2024-12-15',
              time: '14:00',
              customer: {
                name: 'Jane Doe',
                email: 'jane@example.com',
                phone: '555-0123',
                notes: 'First time customer',
              },
            }),
          })
        );
      });
    });
  });

  describe('Confirmation Step', () => {
    beforeEach(() => {
      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        currentStep: 5,
        bookingId: 'BOOK123',
        selectedServices: [createMockService({ name: 'Hair Color', price: 150 })],
        selectedStylist: createMockStylist({ name: 'Beth Day' }),
        selectedDate: '2024-12-15',
        selectedTime: '14:00',
        customerInfo: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '555-0123',
        },
      });
    });

    it('displays booking confirmation details', () => {
      render(<BookingFlow />);

      expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
      expect(screen.getByText('BOOK123')).toBeInTheDocument();
      expect(screen.getByText('Hair Color')).toBeInTheDocument();
      expect(screen.getByText('Beth Day')).toBeInTheDocument();
      expect(screen.getByText('December 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('shows calendar integration options', () => {
      render(<BookingFlow />);

      expect(screen.getByText('Add to Calendar')).toBeInTheDocument();
      expect(screen.getByTestId('google-calendar-link')).toBeInTheDocument();
      expect(screen.getByTestId('apple-calendar-link')).toBeInTheDocument();
      expect(screen.getByTestId('outlook-calendar-link')).toBeInTheDocument();
    });

    it('allows starting a new booking', async () => {
      const user = userEvent.setup();
      const resetBooking = jest.fn();

      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        currentStep: 5,
        resetBooking,
      });

      render(<BookingFlow />);

      const newBookingButton = screen.getByRole('button', { name: /book another appointment/i });
      await user.click(newBookingButton);

      expect(resetBooking).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('allows navigating back to previous steps', async () => {
      const user = userEvent.setup();
      const setCurrentStep = jest.fn();

      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        currentStep: 3,
        setCurrentStep,
      });

      render(<BookingFlow />);

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      expect(setCurrentStep).toHaveBeenCalledWith(2);
    });

    it('maintains state when navigating between steps', async () => {
      const selectedServices = [createMockService({ name: 'Hair Color' })];

      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        currentStep: 2,
        selectedServices,
      });

      const { rerender } = render(<BookingFlow />);

      // Go back to step 1
      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        currentStep: 1,
        selectedServices,
      });

      rerender(<BookingFlow />);

      // Verify service is still selected
      const serviceCard = screen.getByTestId('service-hair-color');
      expect(serviceCard).toHaveClass('selected');
    });
  });

  describe('Error Handling', () => {
    it('displays error when API call fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<BookingFlow />);

      await waitFor(() => {
        expect(screen.getByText(/unable to load services/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('handles booking submission failure', async () => {
      const user = userEvent.setup();

      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        currentStep: 4,
        selectedServices: [createMockService()],
        selectedStylist: createMockStylist(),
        selectedDate: '2024-12-15',
        selectedTime: '14:00',
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Booking failed')
      );

      render(<BookingFlow />);

      await user.type(screen.getByLabelText(/name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
      await user.type(screen.getByLabelText(/phone/i), '555-0123');

      const submitButton = screen.getByRole('button', { name: /book appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/booking could not be completed/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('preserves form data on submission failure', async () => {
      const user = userEvent.setup();

      (useBooking as jest.Mock).mockReturnValue({
        ...mockBookingContext,
        currentStep: 4,
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network timeout')
      );

      render(<BookingFlow />);

      const testData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-0123',
        notes: 'Test notes',
      };

      await user.type(screen.getByLabelText(/name/i), testData.name);
      await user.type(screen.getByLabelText(/email/i), testData.email);
      await user.type(screen.getByLabelText(/phone/i), testData.phone);
      await user.type(screen.getByLabelText(/notes/i), testData.notes);

      const submitButton = screen.getByRole('button', { name: /book appointment/i });
      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });

      // Verify form data is preserved
      expect(screen.getByLabelText(/name/i)).toHaveValue(testData.name);
      expect(screen.getByLabelText(/email/i)).toHaveValue(testData.email);
      expect(screen.getByLabelText(/phone/i)).toHaveValue(testData.phone);
      expect(screen.getByLabelText(/notes/i)).toHaveValue(testData.notes);
    });
  });
});