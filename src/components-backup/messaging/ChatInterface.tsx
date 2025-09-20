'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { pusher } from '@/lib/pusher/client'
import { formatDistanceToNow } from 'date-fns'
import { Send, Paperclip, MoreVertical, Phone, Video, Archive } from 'lucide-react'

interface Message {
  id: string
  conversationId: string
  senderId: string
  senderType: 'CUSTOMER' | 'STAFF' | 'SYSTEM'
  content: string
  metadata?: {
    senderName?: string
    attachments?: any[]
  }
  readAt?: Date | null
  createdAt: string
}

interface Conversation {
  id: string
  customerId: string
  staffId?: string
  metadata?: {
    customerName?: string
    staffName?: string
    subject?: string
  }
  lastMessageAt: string
  unreadCount: number
  status: 'ACTIVE' | 'ARCHIVED' | 'CLOSED'
}

interface ChatInterfaceProps {
  userType: 'CUSTOMER' | 'STAFF'
  conversationId?: string
  onConversationSelect?: (conversation: Conversation) => void
}

export default function ChatInterface({
  userType,
  conversationId: initialConversationId,
  onConversationSelect,
}: ChatInterfaceProps) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    initialConversationId || null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Load conversations
  useEffect(() => {
    if (session?.user?.id) {
      loadConversations()
    }
  }, [session])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!session?.user?.id) return

    const userChannel = pusher.subscribe(`private-user-${session.user.id}`)

    userChannel.bind('new-conversation', (conversation: Conversation) => {
      setConversations(prev => [conversation, ...prev])
    })

    userChannel.bind('conversation-assigned', (data: any) => {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === data.conversationId
            ? { ...conv, ...data.conversation }
            : conv
        )
      )
    })

    return () => {
      pusher.unsubscribe(`private-user-${session.user.id}`)
    }
  }, [session])

  // Subscribe to conversation updates
  useEffect(() => {
    if (!selectedConversation) return

    const conversationChannel = pusher.subscribe(
      `private-conversation-${selectedConversation}`
    )

    conversationChannel.bind('new-message', (message: Message) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()

      // Mark as read if window is focused
      if (document.hasFocus() && message.senderId !== session?.user?.id) {
        markMessagesAsRead([message.id])
      }
    })

    conversationChannel.bind('typing-indicator', (data: any) => {
      if (data.userId !== session?.user?.id) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set(prev).add(data.userId))
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.userId)
            return newSet
          })
        }
      }
    })

    conversationChannel.bind('messages-read', (data: any) => {
      if (data.userId !== session?.user?.id) {
        setMessages(prev =>
          prev.map(msg =>
            data.messageIds === 'all' || data.messageIds.includes(msg.id)
              ? { ...msg, readAt: data.readAt }
              : msg
          )
        )
      }
    })

    return () => {
      pusher.unsubscribe(`private-conversation-${selectedConversation}`)
    }
  }, [selectedConversation, session])

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/messaging/conversations?userType=${userType}`)
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`)
      const data = await response.json()
      setMessages(data.reverse())
      scrollToBottom()
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConversation,
      senderId: session?.user?.id || '',
      senderType: userType,
      content: newMessage,
      metadata: {
        senderName: session?.user?.name || 'You',
      },
      readAt: null,
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [...prev, tempMessage])
    setNewMessage('')
    scrollToBottom()

    try {
      const response = await fetch(
        `/api/messaging/conversations/${selectedConversation}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newMessage,
            senderType: userType,
          }),
        }
      )

      const sentMessage = await response.json()
      setMessages(prev =>
        prev.map(msg => (msg.id === tempMessage.id ? sentMessage : msg))
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
    }
  }

  const handleTyping = (isTyping: boolean) => {
    if (!selectedConversation) return

    fetch(`/api/messaging/conversations/${selectedConversation}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isTyping }),
    })
  }

  const handleMessageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true)
      handleTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      handleTyping(false)
    }, 1000)
  }

  const markMessagesAsRead = async (messageIds: string[]) => {
    if (!selectedConversation) return

    try {
      await fetch(`/api/messaging/conversations/${selectedConversation}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds }),
      })
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  const archiveConversation = async () => {
    if (!selectedConversation) return

    try {
      await fetch(`/api/messaging/conversations/${selectedConversation}/archive`, {
        method: 'POST',
      })

      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation
            ? { ...conv, status: 'ARCHIVED' }
            : conv
        )
      )

      setSelectedConversation(null)
    } catch (error) {
      console.error('Failed to archive conversation:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation.id)
    onConversationSelect?.(conversation)

    // Clear unread count
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
      )
    )
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Messages</h3>
        </div>

        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => selectConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedConversation === conversation.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {userType === 'CUSTOMER'
                      ? conversation.metadata?.staffName || 'Support Team'
                      : conversation.metadata?.customerName || 'Customer'}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.metadata?.subject || 'No subject'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                      addSuffix: true,
                    })}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">
                  {conversations.find(c => c.id === selectedConversation)?.metadata?.[
                    userType === 'CUSTOMER' ? 'staffName' : 'customerName'
                  ] || 'Chat'}
                </h3>
                <p className="text-sm text-gray-500">
                  {conversations.find(c => c.id === selectedConversation)?.status}
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Video className="w-5 h-5" />
                </button>
                <button
                  onClick={archiveConversation}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Archive className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === session?.user?.id
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === session?.user?.id
                            ? 'bg-blue-500 text-white'
                            : message.senderType === 'SYSTEM'
                            ? 'bg-gray-200 text-gray-700 italic'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.senderType !== 'SYSTEM' && (
                          <p className="text-xs font-medium mb-1 opacity-75">
                            {message.metadata?.senderName || 'Unknown'}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs opacity-75">
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                          {message.senderId === session?.user?.id && message.readAt && (
                            <span className="text-xs opacity-75">Read</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {typingUsers.size > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleMessageInput}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}