import { prisma } from '@/lib/db/prisma'
import { pusher } from '@/lib/pusher/server'
import { nanoid } from 'nanoid'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderType: 'CUSTOMER' | 'STAFF' | 'SYSTEM'
  content: string
  metadata?: any
  readAt?: Date | null
  createdAt: Date
}

export interface Conversation {
  id: string
  customerId: string
  staffId?: string
  appointmentId?: string
  orderId?: string
  status: 'ACTIVE' | 'ARCHIVED' | 'CLOSED'
  lastMessageAt: Date
  unreadCount: number
  metadata?: any
}

export interface TypingIndicator {
  conversationId: string
  userId: string
  isTyping: boolean
}

export class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(
    customerId: string,
    staffId?: string,
    context?: {
      appointmentId?: string
      orderId?: string
      subject?: string
    }
  ): Promise<Conversation> {
    const conversation = await prisma.conversation.create({
      data: {
        id: nanoid(),
        customer_id: customerId,
        staff_id: staffId,
        appointment_id: context?.appointmentId,
        order_id: context?.orderId,
        status: 'ACTIVE',
        metadata: {
          subject: context?.subject || 'General Inquiry',
          createdBy: staffId ? 'STAFF' : 'CUSTOMER',
        },
      },
      include: {
        customer: true,
        staff: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
        },
      },
    })

    // Send real-time notification
    await this.notifyConversationCreated(conversation)

    return this.formatConversation(conversation)
  }

  /**
   * Get conversations for a user
   */
  async getConversations(
    userId: string,
    userType: 'CUSTOMER' | 'STAFF',
    filters?: {
      status?: 'ACTIVE' | 'ARCHIVED' | 'CLOSED'
      hasUnread?: boolean
      limit?: number
    }
  ) {
    const where: any = {
      deleted_at: null,
      ...(filters?.status && { status: filters.status }),
    }

    if (userType === 'CUSTOMER') {
      where.customer_id = userId
    } else {
      where.staff_id = userId
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        customer: true,
        staff: {
          include: {
            user: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
        },
        _count: {
          select: {
            messages: {
              where: {
                read_at: null,
                sender_id: { not: userId },
              },
            },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: filters?.limit || 50,
    })

    return conversations.map(conv => ({
      ...this.formatConversation(conv),
      unreadCount: conv._count.messages,
    }))
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: 'CUSTOMER' | 'STAFF',
    content: string,
    metadata?: any
  ): Promise<Message> {
    // Validate conversation exists and sender is participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        staff: true,
      },
    })

    if (!conversation) {
      throw new Error('Conversation not found')
    }

    if (senderType === 'CUSTOMER' && conversation.customer_id !== senderId) {
      throw new Error('Unauthorized: Not a participant in this conversation')
    }

    if (senderType === 'STAFF' && conversation.staff_id !== senderId) {
      throw new Error('Unauthorized: Not assigned to this conversation')
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        id: nanoid(),
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: senderType,
        content,
        metadata,
      },
      include: {
        sender_customer: true,
        sender_staff: {
          include: {
            user: true,
          },
        },
      },
    })

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updated_at: new Date(),
        metadata: {
          ...conversation.metadata,
          lastMessagePreview: content.substring(0, 100),
          lastMessageAt: new Date(),
        },
      },
    })

    // Send real-time notification
    await this.broadcastMessage(conversationId, message)

    // Send push notification if recipient is offline
    await this.sendPushNotification(conversation, message)

    return this.formatMessage(message)
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
    messageIds?: string[]
  ) {
    const where: any = {
      conversation_id: conversationId,
      sender_id: { not: userId },
      read_at: null,
    }

    if (messageIds?.length) {
      where.id = { in: messageIds }
    }

    const updated = await prisma.message.updateMany({
      where,
      data: {
        read_at: new Date(),
      },
    })

    // Broadcast read receipts
    if (updated.count > 0) {
      await pusher.trigger(
        `private-conversation-${conversationId}`,
        'messages-read',
        {
          userId,
          messageIds: messageIds || 'all',
          readAt: new Date(),
        }
      )
    }

    return updated.count
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    options?: {
      cursor?: string
      limit?: number
      includeSystem?: boolean
    }
  ) {
    const messages = await prisma.message.findMany({
      where: {
        conversation_id: conversationId,
        deleted_at: null,
        ...(options?.includeSystem === false && {
          sender_type: { not: 'SYSTEM' },
        }),
      },
      include: {
        sender_customer: true,
        sender_staff: {
          include: {
            user: true,
          },
        },
        attachments: true,
      },
      orderBy: { created_at: 'desc' },
      take: options?.limit || 50,
      ...(options?.cursor && {
        cursor: { id: options.cursor },
        skip: 1,
      }),
    })

    return messages.map(msg => this.formatMessage(msg))
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ) {
    await pusher.trigger(
      `private-conversation-${conversationId}`,
      'typing-indicator',
      {
        userId,
        isTyping,
        timestamp: new Date(),
      }
    )
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // Verify user is participant
    if (conversation.customer_id !== userId && conversation.staff_id !== userId) {
      throw new Error('Unauthorized: Not a participant')
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'ARCHIVED',
        metadata: {
          ...conversation.metadata,
          archivedBy: userId,
          archivedAt: new Date(),
        },
      },
    })

    await pusher.trigger(
      `private-conversation-${conversationId}`,
      'conversation-archived',
      { archivedBy: userId }
    )
  }

  /**
   * Assign conversation to staff member
   */
  async assignToStaff(conversationId: string, staffId: string) {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        staff_id: staffId,
        metadata: {
          assignedAt: new Date(),
        },
      },
      include: {
        staff: {
          include: {
            user: true,
          },
        },
      },
    })

    // Create system message
    await this.sendSystemMessage(
      conversationId,
      `Conversation assigned to ${conversation.staff?.user.name}`
    )

    // Notify staff member
    await pusher.trigger(
      `private-user-${staffId}`,
      'conversation-assigned',
      { conversationId, conversation }
    )

    return conversation
  }

  /**
   * Send automated response
   */
  async sendAutomatedResponse(
    conversationId: string,
    responseType: 'GREETING' | 'AWAY' | 'CONFIRMATION' | 'CUSTOM',
    customMessage?: string
  ) {
    const templates = {
      GREETING: "Hello! Thanks for reaching out. A team member will be with you shortly.",
      AWAY: "We're currently away but will respond to your message as soon as possible.",
      CONFIRMATION: "We've received your message and will get back to you soon.",
      CUSTOM: customMessage || "Thank you for your message.",
    }

    return await this.sendMessage(
      conversationId,
      'SYSTEM',
      'SYSTEM',
      templates[responseType],
      { type: 'AUTOMATED_RESPONSE', responseType }
    )
  }

  /**
   * Get conversation analytics
   */
  async getConversationAnalytics(
    branchId: string,
    startDate: Date,
    endDate: Date
  ) {
    const conversations = await prisma.conversation.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        customer: {
          branch_id: branchId,
        },
      },
      include: {
        messages: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    // Calculate metrics
    const totalConversations = conversations.length
    const activeConversations = conversations.filter(c => c.status === 'ACTIVE').length
    const averageMessages = conversations.reduce((sum, c) => sum + c._count.messages, 0) / totalConversations

    // Response time analysis
    const responseTimes: number[] = []
    for (const conv of conversations) {
      const messages = conv.messages.sort((a, b) =>
        a.created_at.getTime() - b.created_at.getTime()
      )

      for (let i = 1; i < messages.length; i++) {
        if (messages[i].sender_type === 'STAFF' && messages[i-1].sender_type === 'CUSTOMER') {
          const responseTime = messages[i].created_at.getTime() - messages[i-1].created_at.getTime()
          responseTimes.push(responseTime)
        }
      }
    }

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

    // Satisfaction scoring (based on conversation resolution)
    const resolvedConversations = conversations.filter(c => c.status === 'CLOSED').length
    const satisfactionRate = (resolvedConversations / totalConversations) * 100

    return {
      totalConversations,
      activeConversations,
      averageMessagesPerConversation: Math.round(averageMessages),
      averageResponseTime: Math.round(avgResponseTime / 1000 / 60), // minutes
      satisfactionRate: Math.round(satisfactionRate),
      conversationsByDay: this.groupConversationsByDay(conversations),
      topTopics: this.extractTopTopics(conversations),
      staffPerformance: await this.getStaffPerformance(conversations),
    }
  }

  // Helper methods

  private formatConversation(conversation: any): Conversation {
    return {
      id: conversation.id,
      customerId: conversation.customer_id,
      staffId: conversation.staff_id,
      appointmentId: conversation.appointment_id,
      orderId: conversation.order_id,
      status: conversation.status,
      lastMessageAt: conversation.messages?.[0]?.created_at || conversation.created_at,
      unreadCount: 0,
      metadata: {
        ...conversation.metadata,
        customerName: conversation.customer?.name,
        staffName: conversation.staff?.user?.name,
      },
    }
  }

  private formatMessage(message: any): Message {
    return {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      senderType: message.sender_type,
      content: message.content,
      metadata: {
        ...message.metadata,
        senderName: message.sender_type === 'CUSTOMER'
          ? message.sender_customer?.name
          : message.sender_staff?.user?.name,
        attachments: message.attachments,
      },
      readAt: message.read_at,
      createdAt: message.created_at,
    }
  }

  private async broadcastMessage(conversationId: string, message: any) {
    await pusher.trigger(
      `private-conversation-${conversationId}`,
      'new-message',
      this.formatMessage(message)
    )
  }

  private async sendPushNotification(conversation: any, message: any) {
    // Implementation would integrate with push notification service
    // This is a placeholder for the actual implementation
    console.log('Push notification would be sent here')
  }

  private async notifyConversationCreated(conversation: any) {
    if (conversation.staff_id) {
      await pusher.trigger(
        `private-user-${conversation.staff_id}`,
        'new-conversation',
        this.formatConversation(conversation)
      )
    }
  }

  private async sendSystemMessage(conversationId: string, content: string) {
    return await prisma.message.create({
      data: {
        id: nanoid(),
        conversation_id: conversationId,
        sender_id: 'SYSTEM',
        sender_type: 'SYSTEM',
        content,
        metadata: { type: 'SYSTEM_MESSAGE' },
      },
    })
  }

  private groupConversationsByDay(conversations: any[]) {
    const groups: Record<string, number> = {}

    conversations.forEach(conv => {
      const day = conv.created_at.toISOString().split('T')[0]
      groups[day] = (groups[day] || 0) + 1
    })

    return Object.entries(groups).map(([date, count]) => ({
      date,
      count,
    }))
  }

  private extractTopTopics(conversations: any[]) {
    const topics: Record<string, number> = {}

    conversations.forEach(conv => {
      const subject = conv.metadata?.subject || 'General'
      topics[subject] = (topics[subject] || 0) + 1
    })

    return Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))
  }

  private async getStaffPerformance(conversations: any[]) {
    const staffMetrics: Record<string, any> = {}

    conversations.forEach(conv => {
      if (conv.staff_id) {
        if (!staffMetrics[conv.staff_id]) {
          staffMetrics[conv.staff_id] = {
            totalConversations: 0,
            totalMessages: 0,
            resolvedConversations: 0,
          }
        }

        staffMetrics[conv.staff_id].totalConversations++
        staffMetrics[conv.staff_id].totalMessages += conv.messages.filter(
          (m: any) => m.sender_id === conv.staff_id
        ).length

        if (conv.status === 'CLOSED') {
          staffMetrics[conv.staff_id].resolvedConversations++
        }
      }
    })

    return Object.entries(staffMetrics).map(([staffId, metrics]) => ({
      staffId,
      ...metrics,
      resolutionRate: (metrics.resolvedConversations / metrics.totalConversations) * 100,
    }))
  }
}