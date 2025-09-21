'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Bot, User, Sparkles, Clock } from 'lucide-react'
import AnimatedButton from '@/components/ui/AnimatedButton'
import { useSound } from '@/hooks/useSound'

interface Message {
  id: string
  text: string
  sender: 'user' | 'agent' | 'bot'
  timestamp: Date
  typing?: boolean
}

interface QuickReply {
  text: string
  response: string
}

const quickReplies: QuickReply[] = [
  { text: 'Book Appointment', response: 'I\'ll help you book an appointment. What service are you interested in?' },
  { text: 'Check Hours', response: 'We\'re open Mon-Fri 9AM-8PM, Sat 9AM-6PM, and Sun 10AM-5PM.' },
  { text: 'View Services', response: 'We offer hair styling, coloring, nails, spa treatments, and more! What interests you?' },
  { text: 'Pricing Info', response: 'Our services start at $30 for basic treatments. Would you like specific pricing?' },
]

const aiResponses: { [key: string]: string } = {
  'hello': 'Hello! Welcome to Pink Blueberry Salon! How can I help you today? 💅',
  'hi': 'Hi there! I\'m here to help with appointments, services, or any questions! ✨',
  'book': 'I\'d love to help you book an appointment! What service are you interested in?',
  'price': 'Our pricing varies by service. Hair cuts start at $50, coloring from $80, and spa treatments from $60.',
  'hours': 'We\'re open Mon-Fri 9AM-8PM, Sat 9AM-6PM, and Sun 10AM-5PM.',
  'location': 'We\'re located at 123 Beauty Lane, Downtown. Free parking available!',
  'services': 'We offer: Hair (cuts, color, treatments), Nails (manicure, pedicure), Spa (facials, massage), and Makeup services!',
  'default': 'I\'m here to help! You can ask about services, booking, hours, or connect with a human agent.',
}

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to Pink Blueberry Salon! I\'m your AI beauty assistant. How can I help you today? 💅✨',
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [agentOnline, setAgentOnline] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { playClick, playSuccess } = useSound()

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Simulate agent coming online after 30 seconds
    const timer = setTimeout(() => {
      setAgentOnline(true)
      addMessage('A beauty consultant is now available if you need personalized help!', 'agent')
    }, 30000)
    return () => clearTimeout(timer)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addMessage = (text: string, sender: 'user' | 'agent' | 'bot') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleSend = () => {
    if (!inputText.trim()) return

    playClick()
    addMessage(inputText, 'user')
    const userInput = inputText.toLowerCase()
    setInputText('')
    setIsTyping(true)

    // Simulate AI response delay
    setTimeout(() => {
      const response = getAIResponse(userInput)
      addMessage(response, 'bot')
      setIsTyping(false)
      playSuccess()
    }, 1000 + Math.random() * 1000)
  }

  const getAIResponse = (input: string): string => {
    // Check for keywords in the input
    for (const [keyword, response] of Object.entries(aiResponses)) {
      if (input.includes(keyword)) {
        return response
      }
    }
    return aiResponses.default
  }

  const handleQuickReply = (reply: QuickReply) => {
    playClick()
    addMessage(reply.text, 'user')
    setIsTyping(true)

    setTimeout(() => {
      addMessage(reply.response, 'bot')
      setIsTyping(false)
      playSuccess()
    }, 1000)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={() => {
          setIsOpen(true)
          playClick()
        }}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <MessageCircle className="w-6 h-6" />
        {agentOnline && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    {agentOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold">Beauty Support</h3>
                    <p className="text-xs text-blue-100">
                      {agentOnline ? 'Agent Online' : 'AI Assistant'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    playClick()
                  }}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
              {messages.map(message => (
                <motion.div
                  key={message.id}
                  className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.sender !== 'user' && (
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'bot'
                          ? 'bg-purple-100 dark:bg-purple-900'
                          : 'bg-blue-100 dark:bg-blue-900'
                      }`}>
                        {message.sender === 'bot' ? (
                          <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-[70%]`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : message.sender === 'bot'
                          ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                          : 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950 dark:to-blue-950 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(message.timestamp)}
                    </p>
                  </div>

                  {message.sender === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  className="flex gap-2 justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex gap-1">
                      <motion.span
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(reply)}
                    className="flex-shrink-0 px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
                <AnimatedButton
                  onClick={handleSend}
                  size="sm"
                  variant="primary"
                  gradient
                  icon={<Send className="w-4 h-4" />}
                  disabled={!inputText.trim()}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}