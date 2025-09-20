import Pusher from 'pusher'

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// Broadcast event to a channel
export async function broadcastEvent(
  channel: string,
  event: string,
  data: any
) {
  try {
    await pusherServer.trigger(channel, event, data)
    return { success: true }
  } catch (error) {
    console.error('Pusher broadcast error:', error)
    return { success: false, error }
  }
}

// Broadcast to multiple channels
export async function broadcastToMultiple(
  channels: string[],
  event: string,
  data: any
) {
  try {
    await pusherServer.trigger(channels, event, data)
    return { success: true }
  } catch (error) {
    console.error('Pusher multi-broadcast error:', error)
    return { success: false, error }
  }
}

// Send notification to user
export async function sendUserNotification(
  userId: string,
  notification: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    action?: {
      label: string
      url: string
    }
  }
) {
  const channel = `private-user-${userId}`
  return broadcastEvent(channel, 'notification', notification)
}

// Notify staff of appointment changes
export async function notifyAppointmentChange(
  appointment: any,
  action: 'created' | 'updated' | 'cancelled'
) {
  const promises = []

  // Notify staff member
  if (appointment.staff_id) {
    promises.push(
      broadcastEvent(
        `private-staff-${appointment.staff_id}`,
        `appointment:${action}`,
        appointment
      )
    )
  }

  // Notify branch
  if (appointment.branch_id) {
    promises.push(
      broadcastEvent(
        `branch-${appointment.branch_id}`,
        `appointment:${action}`,
        appointment
      )
    )
  }

  // Notify customer
  if (appointment.customer_id) {
    promises.push(
      broadcastEvent(
        `private-user-${appointment.customer?.user_id}`,
        `appointment:${action}`,
        appointment
      )
    )
  }

  await Promise.all(promises)
}

// Update real-time metrics
export async function updateMetrics(
  tenantId: string,
  metrics: any
) {
  return broadcastEvent(
    `private-tenant-${tenantId}`,
    'metrics:update',
    metrics
  )
}

// Authenticate user for private/presence channels
export function authenticateChannel(
  socketId: string,
  channel: string,
  userId?: string,
  userData?: any
) {
  if (channel.startsWith('presence-')) {
    // Presence channel authentication
    const presenceData = {
      user_id: userId || 'anonymous',
      user_info: userData || {},
    }
    return pusherServer.authorizeChannel(socketId, channel, presenceData)
  } else if (channel.startsWith('private-')) {
    // Private channel authentication
    return pusherServer.authorizeChannel(socketId, channel)
  }

  throw new Error('Invalid channel type')
}

// Get channel info
export async function getChannelInfo(channel: string) {
  try {
    const response = await pusherServer.get({
      path: `/channels/${channel}`,
    })
    return response
  } catch (error) {
    console.error('Error getting channel info:', error)
    return null
  }
}

// Get presence channel users
export async function getPresenceUsers(channel: string) {
  try {
    const response = await pusherServer.get({
      path: `/channels/${channel}/users`,
    })
    return response
  } catch (error) {
    console.error('Error getting presence users:', error)
    return null
  }
}