import Pusher from 'pusher-js'

// Client-side Pusher instance
export const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  authEndpoint: '/api/pusher/auth',
  auth: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
})

// Channel types
export const CHANNELS = {
  // Public channels
  BRANCH: (branchId: string) => `branch-${branchId}`,

  // Private channels
  USER: (userId: string) => `private-user-${userId}`,
  STAFF: (staffId: string) => `private-staff-${staffId}`,
  TENANT: (tenantId: string) => `private-tenant-${tenantId}`,

  // Presence channels
  BRANCH_PRESENCE: (branchId: string) => `presence-branch-${branchId}`,
  ADMIN_PRESENCE: (tenantId: string) => `presence-admin-${tenantId}`,
}

// Event types
export const EVENTS = {
  // Appointment events
  APPOINTMENT_CREATED: 'appointment:created',
  APPOINTMENT_UPDATED: 'appointment:updated',
  APPOINTMENT_CANCELLED: 'appointment:cancelled',
  APPOINTMENT_CONFIRMED: 'appointment:confirmed',
  APPOINTMENT_REMINDER: 'appointment:reminder',

  // Booking events
  SLOT_BOOKED: 'slot:booked',
  SLOT_RELEASED: 'slot:released',
  WAITLIST_AVAILABLE: 'waitlist:available',

  // Payment events
  PAYMENT_RECEIVED: 'payment:received',
  PAYMENT_FAILED: 'payment:failed',
  REFUND_PROCESSED: 'refund:processed',

  // Staff events
  STAFF_CHECKIN: 'staff:checkin',
  STAFF_CHECKOUT: 'staff:checkout',
  STAFF_BREAK_START: 'staff:break:start',
  STAFF_BREAK_END: 'staff:break:end',

  // Customer events
  CUSTOMER_ARRIVED: 'customer:arrived',
  CUSTOMER_SERVICING: 'customer:servicing',
  CUSTOMER_COMPLETED: 'customer:completed',

  // Notification events
  NOTIFICATION: 'notification',
  ALERT: 'alert',
  MESSAGE: 'message',

  // Analytics events
  METRICS_UPDATE: 'metrics:update',
  REPORT_GENERATED: 'report:generated',
}

// Subscribe to a channel
export function subscribeToChannel(channel: string) {
  return pusherClient.subscribe(channel)
}

// Unsubscribe from a channel
export function unsubscribeFromChannel(channel: string) {
  pusherClient.unsubscribe(channel)
}

// Bind to an event
export function bindEvent(channel: string, event: string, callback: (data: any) => void) {
  const pusherChannel = pusherClient.channel(channel) || subscribeToChannel(channel)
  pusherChannel.bind(event, callback)

  // Return unbind function
  return () => {
    pusherChannel.unbind(event, callback)
  }
}

// Trigger client event (for presence channels)
export function triggerClientEvent(channel: string, event: string, data: any) {
  const pusherChannel = pusherClient.channel(channel)
  if (pusherChannel && channel.startsWith('presence-')) {
    pusherChannel.trigger(`client-${event}`, data)
  }
}

// Get presence channel members
export function getPresenceMembers(channel: string) {
  const pusherChannel = pusherClient.channel(channel)
  if (pusherChannel && channel.startsWith('presence-')) {
    return (pusherChannel as any).members
  }
  return null
}