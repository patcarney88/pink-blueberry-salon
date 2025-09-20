import { NextRequest, NextResponse } from 'next/server';
import { availabilityService } from '@/lib/booking/availability';
import { z } from 'zod';

const availabilitySchema = z.object({
  branchId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()),
  date: z.string().datetime(),
  staffId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  timezone: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = availabilitySchema.parse(body);

    // Get available slots
    const slots = await availabilityService.getAvailableSlots({
      branchId: validatedData.branchId,
      serviceIds: validatedData.serviceIds,
      date: new Date(validatedData.date),
      staffId: validatedData.staffId,
      customerId: validatedData.customerId,
      timezone: validatedData.timezone
    });

    return NextResponse.json({
      success: true,
      data: {
        date: validatedData.date,
        slots: slots.map(slot => ({
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          staffId: slot.staffId,
          available: slot.available,
          price: slot.price,
          isPeak: slot.isPeak
        })),
        totalSlots: slots.length
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Availability check failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check availability'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const branchId = searchParams.get('branchId');
    const serviceIds = searchParams.get('serviceIds')?.split(',');
    const date = searchParams.get('date');
    const staffId = searchParams.get('staffId') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const timezone = searchParams.get('timezone') || undefined;

    if (!branchId || !serviceIds || !date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters'
        },
        { status: 400 }
      );
    }

    const slots = await availabilityService.getAvailableSlots({
      branchId,
      serviceIds,
      date: new Date(date),
      staffId,
      customerId,
      timezone
    });

    return NextResponse.json({
      success: true,
      data: {
        date,
        slots: slots.map(slot => ({
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          staffId: slot.staffId,
          available: slot.available,
          price: slot.price,
          isPeak: slot.isPeak
        })),
        totalSlots: slots.length
      }
    });
  } catch (error) {
    console.error('Availability check failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check availability'
      },
      { status: 500 }
    );
  }
}