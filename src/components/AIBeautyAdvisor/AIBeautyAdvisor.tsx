import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ShoppingBagIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type {
  Message,
  UserProfile,
  ServiceRecommendation,
  ProductRecommendation,
  QuestionnaireStep,
  Consultation,
} from './types';
import {
  services,
  products,
  questionnaireSteps,
  generateAIResponse,
  getSeasonalRecommendations,
} from './data';

interface AIBeautyAdvisorProps {
  onBookService?: (service: ServiceRecommendation) => void;
  onAddToCart?: (product: ProductRecommendation) => void;
  userProfile?: UserProfile;
}

export const AIBeautyAdvisor: React.FC<AIBeautyAdvisorProps> = ({
  onBookService,
  onAddToCart,
  userProfile: initialProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>(
    initialProfile || { name: 'Guest' }
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [consultationHistory, setConsultationHistory] = useState<Consultation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        type: 'ai',
        content: `Welcome to Pink Blueberry! ✨ I'm your personal beauty advisor. I can help you find the perfect service, recommend products, or book your next appointment. How can I make you feel beautiful today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);

      // Get seasonal recommendations
      const seasonal = getSeasonalRecommendations();
      if (seasonal) {
        setTimeout(() => {
          const seasonalMessage: Message = {
            id: '2',
            type: 'ai',
            content: seasonal.message + ' ' + seasonal.tip,
            timestamp: new Date(),
            recommendations: seasonal.services
              .map(id => services.find(s => s.id === id))
              .filter(Boolean)
              .map(service => ({
                ...service!,
                matchScore: 85,
                reason: 'Seasonal favorite',
              })),
          };
          setMessages(prev => [...prev, seasonalMessage]);
        }, 1500);
      }
    }
  }, [isOpen]);

  // Handle sending messages
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue, userProfile);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date(),
        recommendations: aiResponse.recommendations,
        products: aiResponse.products,
      };

      setIsTyping(false);
      setMessages(prev => [...prev, aiMessage]);
    }, 1500 + Math.random() * 1000);
  }, [inputValue, userProfile]);

  // Handle questionnaire answers
  const handleQuestionnaireAnswer = (value: string | string[]) => {
    const step = questionnaireSteps[currentStep];

    // Update user profile
    const updates: Partial<UserProfile> = {};
    if (step.id === 'hair-type') updates.hairType = value as any;
    if (step.id === 'hair-length') updates.hairLength = value as any;
    if (step.id === 'hair-concerns') updates.hairConcerns = value as any;
    if (step.id === 'style-preference') updates.stylePreference = value as any;

    setUserProfile(prev => ({ ...prev, ...updates }));

    // Move to next step or finish
    if (currentStep < questionnaireSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowQuestionnaire(false);
      setCurrentStep(0);

      // Generate personalized recommendations
      const personalizedMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Perfect! Based on your profile, I've found some services that would be amazing for you! 🎯`,
        timestamp: new Date(),
        recommendations: services
          .filter(s => {
            // Smart filtering based on profile
            if (updates.hairConcerns?.includes('damage') && s.category === 'treatment') return true;
            if (updates.stylePreference === 'trendy' && s.trending) return true;
            if (updates.stylePreference === 'glamorous' && s.category === 'styling') return true;
            return s.popular;
          })
          .slice(0, 3)
          .map(s => ({
            ...s,
            matchScore: 80 + Math.random() * 20,
            reason: 'Personalized for you',
          })),
      };

      setMessages(prev => [...prev, personalizedMessage]);
    }
  };

  // Save consultation
  const saveConsultation = () => {
    const consultation: Consultation = {
      id: Date.now().toString(),
      date: new Date(),
      messages: messages,
      recommendations: messages
        .flatMap(m => m.recommendations || []),
      products: messages
        .flatMap(m => m.products || []),
    };
    setConsultationHistory(prev => [...prev, consultation]);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <SparklesIcon className="h-6 w-6" />
      </motion.button>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-4xl h-[80vh] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <SparklesIcon className="h-6 w-6" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">AI Beauty Advisor</h2>
                      <p className="text-sm opacity-90">Always here to help you shine</p>
                    </div>
                  </div>
                  <button
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex space-x-2 mt-4">
                  <button
                    className="px-3 py-1 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors"
                    onClick={() => setShowQuestionnaire(true)}
                  >
                    📋 Hair Quiz
                  </button>
                  <button
                    className="px-3 py-1 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors"
                    onClick={() => {
                      const message = "Show me trending services";
                      setInputValue(message);
                    }}
                  >
                    🔥 Trending
                  </button>
                  <button
                    className="px-3 py-1 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors"
                    onClick={saveConsultation}
                  >
                    💾 Save Chat
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="pt-36 pb-20 px-6 h-full overflow-y-auto">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      onBookService={onBookService}
                      onAddToCart={onAddToCart}
                      isLatest={index === messages.length - 1}
                    />
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    className="flex items-center space-x-2 mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="bg-gray-200 rounded-2xl px-4 py-3 flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <motion.div
                          className="h-2 w-2 bg-gray-500 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6 }}
                        />
                        <motion.div
                          className="h-2 w-2 bg-gray-500 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        />
                        <motion.div
                          className="h-2 w-2 bg-gray-500 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about hair care..."
                    className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    className="p-3 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-2xl hover:shadow-lg transition-shadow"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Questionnaire Modal */}
              {showQuestionnaire && (
                <QuestionnaireModal
                  step={questionnaireSteps[currentStep]}
                  onAnswer={handleQuestionnaireAnswer}
                  onClose={() => setShowQuestionnaire(false)}
                  progress={(currentStep + 1) / questionnaireSteps.length}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: Message;
  onBookService?: (service: ServiceRecommendation) => void;
  onAddToCart?: (product: ProductRecommendation) => void;
  isLatest: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onBookService,
  onAddToCart,
  isLatest,
}) => {
  const isUser = message.type === 'user';

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`max-w-lg ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>

        {/* Service Recommendations */}
        {message.recommendations && message.recommendations.length > 0 && (
          <motion.div
            className="mt-3 space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {message.recommendations.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onBook={onBookService}
              />
            ))}
          </motion.div>
        )}

        {/* Product Recommendations */}
        {message.products && message.products.length > 0 && (
          <motion.div
            className="mt-3 space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {message.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Service Card Component
interface ServiceCardProps {
  service: ServiceRecommendation;
  onBook?: (service: ServiceRecommendation) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBook }) => {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-md p-4 border border-gray-100"
      whileHover={{ scale: 1.02, shadow: 'lg' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-800">{service.name}</h3>
            {service.trending && (
              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full flex items-center">
                <FireIcon className="h-3 w-3 mr-1" />
                Trending
              </span>
            )}
            {service.popular && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 text-xs rounded-full flex items-center">
                <StarSolidIcon className="h-3 w-3 mr-1" />
                Popular
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{service.description}</p>
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              {service.duration}
            </span>
            <span className="font-semibold text-pink-600">{service.price}</span>
          </div>
          {service.matchScore && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-pink-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${service.matchScore}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                <span className="text-xs text-gray-500">{service.matchScore}% match</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{service.reason}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => onBook?.(service)}
          className="ml-3 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-blue-500 text-white text-sm rounded-lg hover:shadow-lg transition-shadow"
        >
          Book
        </button>
      </div>
    </motion.div>
  );
};

// Product Card Component
interface ProductCardProps {
  product: ProductRecommendation;
  onAddToCart?: (product: ProductRecommendation) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <motion.div
      className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-xl p-3 border border-pink-200"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 text-sm">{product.name}</h4>
          <p className="text-xs text-gray-600">{product.brand}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="font-semibold text-pink-600 text-sm">{product.price}</span>
            {!product.inStock && (
              <span className="text-xs text-red-500">Out of stock</span>
            )}
          </div>
          {product.reason && (
            <p className="text-xs text-gray-500 mt-1">{product.reason}</p>
          )}
        </div>
        <button
          onClick={() => onAddToCart?.(product)}
          disabled={!product.inStock}
          className="ml-2 p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ShoppingBagIcon className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </motion.div>
  );
};

// Questionnaire Modal Component
interface QuestionnaireModalProps {
  step: QuestionnaireStep;
  onAnswer: (value: string | string[]) => void;
  onClose: () => void;
  progress: number;
}

const QuestionnaireModal: React.FC<QuestionnaireModalProps> = ({
  step,
  onAnswer,
  onClose,
  progress,
}) => {
  const [selected, setSelected] = useState<string | string[]>(
    step.type === 'multiple' ? [] : ''
  );

  const handleSubmit = () => {
    if (selected && (Array.isArray(selected) ? selected.length > 0 : selected)) {
      onAnswer(selected);
      setSelected(step.type === 'multiple' ? [] : '');
    }
  };

  const toggleMultiple = (value: string) => {
    if (Array.isArray(selected)) {
      setSelected(
        selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value]
      );
    }
  };

  return (
    <motion.div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-white rounded-2xl p-6 max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Question {Math.round(progress * 4)} of 4</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-4">{step.question}</h3>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {step.options?.map((option) => {
            const isSelected = step.type === 'multiple'
              ? (selected as string[]).includes(option.value)
              : selected === option.value;

            return (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  step.type === 'multiple'
                    ? toggleMultiple(option.value)
                    : setSelected(option.value)
                }
                className={`w-full p-3 rounded-xl border-2 text-left transition-colors ${
                  isSelected
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{option.label}</p>
                    {option.description && (
                      <p className="text-sm text-gray-500">{option.description}</p>
                    )}
                  </div>
                  {isSelected && (
                    <CheckCircleIcon className="h-5 w-5 text-pink-500" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={
            !selected ||
            (Array.isArray(selected) ? selected.length === 0 : !selected)
          }
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
        >
          {progress < 1 ? 'Next' : 'Get Recommendations'}
          <ArrowRightIcon className="inline h-4 w-4 ml-2" />
        </motion.button>

        {!step.required && (
          <button
            onClick={() => onAnswer('')}
            className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Skip this question
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AIBeautyAdvisor;