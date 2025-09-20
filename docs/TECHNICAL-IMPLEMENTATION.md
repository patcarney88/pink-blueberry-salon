# Technical Implementation Guide

## Pink Blueberry Salon - Next.js 14 Implementation

This guide provides detailed technical implementation patterns and code structures for building the Pink Blueberry Salon platform using Next.js 14, TypeScript, and Vercel.

## Project Structure

```
pink-blueberry-salon/
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── (auth)/               # Auth group routes
│   │   ├── (dashboard)/          # Dashboard group routes
│   │   ├── (booking)/            # Booking flow routes
│   │   ├── (admin)/              # Admin panel routes
│   │   ├── api/                  # API routes
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   └── global.css            # Global styles
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   ├── features/             # Feature-specific components
│   │   ├── layouts/              # Layout components
│   │   └── providers/            # Context providers
│   ├── lib/
│   │   ├── api/                  # API client functions
│   │   ├── auth/                 # Authentication utilities
│   │   ├── db/                   # Database utilities
│   │   ├── services/             # Business logic services
│   │   ├── utils/                # Utility functions
│   │   └── validations/          # Zod schemas
│   ├── hooks/                    # Custom React hooks
│   ├── stores/                   # Zustand stores
│   ├── types/                    # TypeScript types
│   └── middleware.ts             # Next.js middleware
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
├── public/                       # Static assets
├── tests/                        # Test files
└── config files...               # Various config files
```

## Core Implementation Components

### 1. Authentication System

```typescript
// src/lib/auth/auth.config.ts
import { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { compare } from 'bcryptjs';
import { loginSchema } from '@/lib/validations/auth';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: validated.data.email },
          include: {
            tenant: true,
            staff: {
              include: {
                branch: {
                  include: {
                    salon: true
                  }
                }
              }
            }
          }
        });

        if (!user?.hashedPassword) return null;

        const isValid = await compare(
          validated.data.password,
          user.hashedPassword
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          image: user.image
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email!;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (!existingUser) {
          // Create new user with Google account
          await prisma.user.create({
            data: {
              email,
              name: user.name || email.split('@')[0],
              image: user.image,
              provider: 'google',
              providerId: account.providerAccountId
            }
          });
        }
      }
      return true;
    }
  }
};

// src/lib/auth/auth.ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth(authConfig);

// src/app/api/auth/[...nextauth]/route.ts
export { GET, POST } from '@/lib/auth/auth';
```

### 2. Database Service Layer

```typescript
// src/lib/services/booking.service.ts
import { prisma } from '@/lib/db';
import { Booking, BookingStatus, Prisma } from '@prisma/client';
import { cache } from 'react';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { EventEmitter } from '@/lib/events';

export const createBookingSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  services: z.array(z.object({
    serviceId: z.string().uuid(),
    staffId: z.string().uuid().optional(),
    startTime: z.string().datetime()
  })),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
  source: z.enum(['WEB', 'MOBILE', 'PHONE', 'WALK_IN', 'ADMIN']).default('WEB')
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export class BookingService {
  // Cached function for read operations
  static getAvailableSlots = cache(async (
    branchId: string,
    date: string,
    serviceId?: string,
    staffId?: string
  ) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get branch operating hours
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        operatingHours: true,
        settings: true
      }
    });

    if (!branch) throw new Error('Branch not found');

    // Get existing bookings for the day
    const existingBookings = await prisma.bookingService.findMany({
      where: {
        booking: {
          branchId,
          status: {
            notIn: ['CANCELLED', 'NO_SHOW']
          }
        },
        ...(staffId && { staffId }),
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        startTime: true,
        duration: true,
        staffId: true
      }
    });

    // Get staff schedules if staffId provided
    let staffSchedule = null;
    if (staffId) {
      staffSchedule = await prisma.schedule.findFirst({
        where: {
          staffId,
          date: startOfDay,
          isAvailable: true
        }
      });
    }

    // Calculate available slots
    return this.calculateAvailableSlots(
      branch.operatingHours as any,
      existingBookings,
      staffSchedule,
      serviceId ? await this.getServiceDuration(serviceId) : 30
    );
  });

  static async createBooking(input: CreateBookingInput, userId: string) {
    const validated = createBookingSchema.parse(input);

    // Start transaction
    return await prisma.$transaction(async (tx) => {
      // Validate availability for all services
      for (const service of validated.services) {
        const isAvailable = await this.checkAvailability(
          tx,
          validated.branchId,
          service.serviceId,
          service.staffId,
          new Date(service.startTime)
        );

        if (!isAvailable) {
          throw new Error(`Time slot not available for service`);
        }
      }

      // Calculate total amount and duration
      const serviceDetails = await Promise.all(
        validated.services.map(s =>
          tx.service.findUnique({
            where: { id: s.serviceId },
            select: {
              price: true,
              duration: true,
              requiresDeposit: true,
              depositAmount: true
            }
          })
        )
      );

      const totalAmount = serviceDetails.reduce(
        (sum, s) => sum + (s?.price.toNumber() || 0),
        0
      );

      const totalDuration = serviceDetails.reduce(
        (sum, s) => sum + (s?.duration || 0),
        0
      );

      const requiresDeposit = serviceDetails.some(s => s?.requiresDeposit);
      const depositAmount = serviceDetails.reduce(
        (sum, s) => sum + (s?.depositAmount?.toNumber() || 0),
        0
      );

      // Create booking
      const booking = await tx.booking.create({
        data: {
          branchId: validated.branchId,
          customerId: validated.customerId,
          scheduledAt: new Date(validated.scheduledAt),
          duration: totalDuration,
          totalAmount,
          depositPaid: 0,
          status: 'PENDING',
          notes: validated.notes,
          source: validated.source,
          metadata: {
            createdBy: userId,
            requiresDeposit,
            depositAmount
          },
          services: {
            create: validated.services.map((s, index) => ({
              serviceId: s.serviceId,
              staffId: s.staffId,
              startTime: new Date(s.startTime),
              duration: serviceDetails[index]?.duration || 30,
              price: serviceDetails[index]?.price || 0,
              status: 'PENDING'
            }))
          }
        },
        include: {
          services: {
            include: {
              service: true,
              staff: true
            }
          },
          customer: true,
          branch: {
            include: {
              salon: true
            }
          }
        }
      });

      // Emit event for real-time updates
      EventEmitter.emit('booking:created', booking);

      // Revalidate cache
      revalidatePath(`/bookings`);
      revalidatePath(`/calendar`);

      return booking;
    });
  }

  static async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    userId: string
  ) {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        ...(status === 'CONFIRMED' && { confirmedAt: new Date() }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(status === 'CANCELLED' && { cancelledAt: new Date() })
      },
      include: {
        customer: true,
        services: {
          include: {
            service: true,
            staff: true
          }
        }
      }
    });

    // Emit event
    EventEmitter.emit(`booking:${status.toLowerCase()}`, booking);

    // Send notifications
    if (status === 'CONFIRMED') {
      await this.sendConfirmationNotification(booking);
    } else if (status === 'CANCELLED') {
      await this.processCancellation(booking);
    }

    revalidatePath(`/bookings/${bookingId}`);
    return booking;
  }

  private static async checkAvailability(
    tx: Prisma.TransactionClient,
    branchId: string,
    serviceId: string,
    staffId: string | undefined,
    startTime: Date
  ): Promise<boolean> {
    const service = await tx.service.findUnique({
      where: { id: serviceId },
      select: { duration: true }
    });

    if (!service) return false;

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + service.duration);

    // Check for conflicts
    const conflicts = await tx.bookingService.count({
      where: {
        booking: {
          branchId,
          status: {
            notIn: ['CANCELLED', 'NO_SHOW']
          }
        },
        ...(staffId && { staffId }),
        OR: [
          {
            startTime: {
              gte: startTime,
              lt: endTime
            }
          },
          {
            AND: [
              { startTime: { lte: startTime } },
              {
                startTime: {
                  gt: new Date(startTime.getTime() - service.duration * 60000)
                }
              }
            ]
          }
        ]
      }
    });

    return conflicts === 0;
  }

  private static calculateAvailableSlots(
    operatingHours: any,
    existingBookings: any[],
    staffSchedule: any,
    duration: number
  ) {
    const slots = [];
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const hours = operatingHours[dayOfWeek];

    if (!hours || !hours.open) return [];

    const [openHour, openMinute] = hours.open.split(':').map(Number);
    const [closeHour, closeMinute] = hours.close.split(':').map(Number);

    const startTime = new Date();
    startTime.setHours(openHour, openMinute, 0, 0);

    const endTime = new Date();
    endTime.setHours(closeHour, closeMinute, 0, 0);

    const slotDuration = duration;
    const currentTime = new Date(startTime);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      // Check if slot conflicts with existing bookings
      const hasConflict = existingBookings.some(booking => {
        const bookingEnd = new Date(booking.startTime);
        bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.duration);

        return (
          (currentTime >= booking.startTime && currentTime < bookingEnd) ||
          (slotEnd > booking.startTime && slotEnd <= bookingEnd) ||
          (currentTime <= booking.startTime && slotEnd >= bookingEnd)
        );
      });

      if (!hasConflict && slotEnd <= endTime) {
        slots.push({
          startTime: new Date(currentTime),
          endTime: new Date(slotEnd),
          available: true
        });
      }

      currentTime.setMinutes(currentTime.getMinutes() + 15); // 15-minute intervals
    }

    return slots;
  }

  private static async getServiceDuration(serviceId: string): Promise<number> {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { duration: true }
    });
    return service?.duration || 30;
  }

  private static async sendConfirmationNotification(booking: any) {
    // Implementation for sending confirmation emails/SMS
    console.log('Sending confirmation for booking:', booking.id);
  }

  private static async processCancellation(booking: any) {
    // Process refunds if needed
    if (booking.payment && booking.payment.status === 'COMPLETED') {
      // Initiate refund process
      console.log('Processing refund for booking:', booking.id);
    }
  }
}
```

### 3. Real-time Updates with Server-Sent Events

```typescript
// src/lib/realtime/sse.ts
import { EventEmitter } from 'events';

class SSEManager extends EventEmitter {
  private connections: Map<string, Response> = new Map();

  addConnection(id: string, response: Response) {
    this.connections.set(id, response);
  }

  removeConnection(id: string) {
    this.connections.delete(id);
  }

  broadcast(event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    this.connections.forEach((response, id) => {
      try {
        // @ts-ignore - WritableStream type issue
        const writer = response.body?.getWriter();
        writer?.write(new TextEncoder().encode(message));
      } catch (error) {
        console.error(`Failed to send to ${id}:`, error);
        this.removeConnection(id);
      }
    });
  }

  sendToTenant(tenantId: string, event: string, data: any) {
    // Send to specific tenant connections
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    this.connections.forEach((response, id) => {
      if (id.startsWith(`${tenantId}:`)) {
        try {
          // @ts-ignore
          const writer = response.body?.getWriter();
          writer?.write(new TextEncoder().encode(message));
        } catch (error) {
          this.removeConnection(id);
        }
      }
    });
  }
}

export const sseManager = new SSEManager();

// src/app/api/sse/route.ts
import { auth } from '@/lib/auth/auth';
import { sseManager } from '@/lib/realtime/sse';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const connectionId = `${session.user.tenantId}:${session.user.id}`;

      // Send initial connection message
      controller.enqueue(
        new TextEncoder().encode(
          `event: connected\ndata: {"connectionId":"${connectionId}"}\n\n`
        )
      );

      // Setup heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            new TextEncoder().encode('event: ping\ndata: {}\n\n')
          );
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Handle connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        sseManager.removeConnection(connectionId);
      });

      // Store connection
      sseManager.addConnection(connectionId, {
        body: {
          getWriter: () => ({
            write: (chunk: Uint8Array) => controller.enqueue(chunk)
          })
        }
      } as any);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable Nginx buffering
    }
  });
}

// src/hooks/useRealtime.ts
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    const source = new EventSource('/api/sse', {
      withCredentials: true
    });

    source.addEventListener('connected', () => {
      setIsConnected(true);
    });

    source.addEventListener('ping', () => {
      // Keep connection alive
    });

    source.onerror = () => {
      setIsConnected(false);
      // Reconnect after delay
      setTimeout(() => {
        source.close();
        setEventSource(new EventSource('/api/sse', {
          withCredentials: true
        }));
      }, 5000);
    };

    setEventSource(source);

    return () => {
      source.close();
    };
  }, [session]);

  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    if (!eventSource) return () => {};

    eventSource.addEventListener(event, (e: any) => {
      const data = JSON.parse(e.data);
      handler(data);
    });

    return () => {
      // Cleanup would go here
    };
  }, [eventSource]);

  return {
    isConnected,
    subscribe
  };
}
```

### 4. State Management with Zustand

```typescript
// src/stores/booking.store.ts
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Service, Staff, Branch } from '@prisma/client';

interface BookingService {
  service: Service;
  staff?: Staff;
  startTime: Date;
}

interface BookingStore {
  // State
  branch: Branch | null;
  selectedDate: Date;
  selectedServices: BookingService[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  } | null;
  currentStep: 'service' | 'datetime' | 'staff' | 'info' | 'confirm';

  // Actions
  setBranch: (branch: Branch) => void;
  setDate: (date: Date) => void;
  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  assignStaff: (serviceId: string, staff: Staff) => void;
  setServiceTime: (serviceId: string, time: Date) => void;
  setCustomerInfo: (info: typeof this.customerInfo) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;

  // Computed
  getTotalPrice: () => number;
  getTotalDuration: () => number;
  canProceed: () => boolean;
}

export const useBookingStore = create<BookingStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        immer((set, get) => ({
          // Initial state
          branch: null,
          selectedDate: new Date(),
          selectedServices: [],
          customerInfo: null,
          currentStep: 'service',

          // Actions
          setBranch: (branch) => set(state => {
            state.branch = branch;
            state.selectedServices = []; // Reset services when branch changes
          }),

          setDate: (date) => set(state => {
            state.selectedDate = date;
          }),

          addService: (service) => set(state => {
            if (!state.selectedServices.find(s => s.service.id === service.id)) {
              state.selectedServices.push({
                service,
                startTime: state.selectedDate
              });
            }
          }),

          removeService: (serviceId) => set(state => {
            state.selectedServices = state.selectedServices.filter(
              s => s.service.id !== serviceId
            );
          }),

          assignStaff: (serviceId, staff) => set(state => {
            const service = state.selectedServices.find(
              s => s.service.id === serviceId
            );
            if (service) {
              service.staff = staff;
            }
          }),

          setServiceTime: (serviceId, time) => set(state => {
            const service = state.selectedServices.find(
              s => s.service.id === serviceId
            );
            if (service) {
              service.startTime = time;
            }
          }),

          setCustomerInfo: (info) => set(state => {
            state.customerInfo = info;
          }),

          nextStep: () => set(state => {
            const steps: BookingStore['currentStep'][] = [
              'service', 'datetime', 'staff', 'info', 'confirm'
            ];
            const currentIndex = steps.indexOf(state.currentStep);
            if (currentIndex < steps.length - 1) {
              state.currentStep = steps[currentIndex + 1];
            }
          }),

          previousStep: () => set(state => {
            const steps: BookingStore['currentStep'][] = [
              'service', 'datetime', 'staff', 'info', 'confirm'
            ];
            const currentIndex = steps.indexOf(state.currentStep);
            if (currentIndex > 0) {
              state.currentStep = steps[currentIndex - 1];
            }
          }),

          reset: () => set(state => {
            state.branch = null;
            state.selectedDate = new Date();
            state.selectedServices = [];
            state.customerInfo = null;
            state.currentStep = 'service';
          }),

          // Computed
          getTotalPrice: () => {
            const state = get();
            return state.selectedServices.reduce(
              (total, s) => total + Number(s.service.price),
              0
            );
          },

          getTotalDuration: () => {
            const state = get();
            return state.selectedServices.reduce(
              (total, s) => total + s.service.duration,
              0
            );
          },

          canProceed: () => {
            const state = get();
            switch (state.currentStep) {
              case 'service':
                return state.selectedServices.length > 0;
              case 'datetime':
                return state.selectedDate != null;
              case 'staff':
                return state.selectedServices.every(s => s.staff != null);
              case 'info':
                return state.customerInfo != null &&
                       state.customerInfo.name.length > 0 &&
                       state.customerInfo.email.length > 0 &&
                       state.customerInfo.phone.length > 0;
              default:
                return true;
            }
          }
        })),
        {
          name: 'booking-storage',
          partialize: (state) => ({
            branch: state.branch,
            selectedServices: state.selectedServices.map(s => ({
              serviceId: s.service.id,
              staffId: s.staff?.id
            })),
            customerInfo: state.customerInfo
          })
        }
      )
    )
  )
);

// Subscribe to specific state changes
useBookingStore.subscribe(
  (state) => state.currentStep,
  (currentStep) => {
    // Track step changes in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'booking_step', {
        step: currentStep
      });
    }
  }
);
```

### 5. Server Components with Data Fetching

```typescript
// src/app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { DashboardMetrics } from '@/components/features/dashboard/metrics';
import { RecentBookings } from '@/components/features/dashboard/recent-bookings';
import { UpcomingAppointments } from '@/components/features/dashboard/upcoming';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export const metadata = {
  title: 'Dashboard | Pink Blueberry Salon',
  description: 'Manage your salon business'
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {session.user.name}
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton className="h-32" />}>
        <DashboardMetrics tenantId={session.user.tenantId!} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<LoadingSkeleton className="h-96" />}>
          <UpcomingAppointments tenantId={session.user.tenantId!} />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton className="h-96" />}>
          <RecentBookings tenantId={session.user.tenantId!} />
        </Suspense>
      </div>
    </div>
  );
}

// src/components/features/dashboard/metrics.tsx
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface DashboardMetricsProps {
  tenantId: string;
}

export async function DashboardMetrics({ tenantId }: DashboardMetricsProps) {
  // Parallel data fetching
  const [todayMetrics, yesterdayMetrics, monthMetrics] = await Promise.all([
    getTodayMetrics(tenantId),
    getYesterdayMetrics(tenantId),
    getMonthMetrics(tenantId)
  ]);

  const metrics = [
    {
      title: "Today's Revenue",
      value: `$${todayMetrics.revenue.toFixed(2)}`,
      change: calculateChange(todayMetrics.revenue, yesterdayMetrics.revenue),
      changeType: todayMetrics.revenue > yesterdayMetrics.revenue ? 'increase' : 'decrease'
    },
    {
      title: 'Bookings Today',
      value: todayMetrics.bookings,
      change: calculateChange(todayMetrics.bookings, yesterdayMetrics.bookings),
      changeType: todayMetrics.bookings > yesterdayMetrics.bookings ? 'increase' : 'decrease'
    },
    {
      title: 'New Customers',
      value: todayMetrics.newCustomers,
      change: `+${todayMetrics.newCustomers}`,
      changeType: 'increase'
    },
    {
      title: 'Monthly Revenue',
      value: `$${monthMetrics.revenue.toFixed(2)}`,
      change: `${monthMetrics.growth.toFixed(1)}%`,
      changeType: monthMetrics.growth > 0 ? 'increase' : 'decrease'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            {metric.changeType === 'increase' ? (
              <ArrowUpIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className={`text-xs ${
              metric.changeType === 'increase'
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {metric.change} from yesterday
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function getTodayMetrics(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await prisma.booking.aggregate({
    where: {
      branch: {
        salon: { tenantId }
      },
      createdAt: {
        gte: today,
        lt: tomorrow
      },
      status: 'COMPLETED'
    },
    _sum: { totalAmount: true },
    _count: true
  });

  const newCustomers = await prisma.customer.count({
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow
      },
      bookings: {
        some: {
          branch: {
            salon: { tenantId }
          }
        }
      }
    }
  });

  return {
    revenue: result._sum.totalAmount?.toNumber() || 0,
    bookings: result._count,
    newCustomers
  };
}

function calculateChange(current: number, previous: number): string {
  if (previous === 0) return '+100%';
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
}
```

### 6. API Routes with Validation

```typescript
// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { BookingService, createBookingSchema } from '@/lib/services/booking.service';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limiting
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true
});

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const identifier = session.user.id;
    const { success } = await ratelimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createBookingSchema.parse(body);

    // Create booking
    const booking = await BookingService.createBooking(
      validatedData,
      session.user.id
    );

    return NextResponse.json(booking, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    const where: any = {};

    // Build filters based on user role
    if (session.user.role === 'CUSTOMER') {
      where.customerId = session.user.id;
    } else {
      // Staff can see bookings for their branch
      const staff = await prisma.staff.findFirst({
        where: { userId: session.user.id }
      });

      if (staff) {
        where.branchId = staff.branchId;
      }
    }

    if (status) {
      where.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      where.scheduledAt = {
        gte: startDate,
        lte: endDate
      };
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: true,
          services: {
            include: {
              service: true,
              staff: true
            }
          },
          branch: true,
          payment: true
        },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 7. Middleware for Multi-tenancy

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Get JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Redirect to login if not authenticated
  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Multi-tenant resolution from subdomain
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];

  const response = NextResponse.next();

  // Add tenant context to headers
  if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
    response.headers.set('x-tenant-slug', subdomain);
  }

  // Add user context to headers
  if (token) {
    response.headers.set('x-user-id', token.id as string);
    response.headers.set('x-user-role', token.role as string);
    response.headers.set('x-tenant-id', token.tenantId as string);
  }

  // CORS headers for API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
```

## Performance Optimization

### 1. Image Optimization

```typescript
// src/components/ui/optimized-image.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`
          duration-700 ease-in-out
          ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
        `}
        onLoadingComplete={() => setIsLoading(false)}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  );
}
```

### 2. Bundle Optimization

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'date-fns', 'lodash'],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## Deployment Configuration

### Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "app/api/bookings/availability/route.ts": {
      "maxDuration": 10
    },
    "app/api/reports/generate/route.ts": {
      "maxDuration": 60
    },
    "app/api/webhooks/stripe/route.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/generate-reports",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Testing Implementation

### Unit Tests

```typescript
// tests/services/booking.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BookingService } from '@/lib/services/booking.service';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    booking: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

describe('BookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create a booking with valid input', async () => {
      const input = {
        branchId: 'branch-id',
        customerId: 'customer-id',
        services: [{
          serviceId: 'service-id',
          startTime: '2024-01-15T10:00:00Z'
        }],
        scheduledAt: '2024-01-15T10:00:00Z',
        source: 'WEB' as const
      };

      const mockBooking = {
        id: 'booking-id',
        ...input,
        status: 'PENDING'
      };

      prisma.$transaction.mockResolvedValue(mockBooking);

      const result = await BookingService.createBooking(input, 'user-id');

      expect(result).toEqual(mockBooking);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid time slot', async () => {
      // Test implementation
    });
  });
});
```

This technical implementation guide provides a comprehensive foundation for building the Pink Blueberry Salon platform with Next.js 14, including authentication, real-time updates, state management, and production-ready patterns for a scalable SaaS application.