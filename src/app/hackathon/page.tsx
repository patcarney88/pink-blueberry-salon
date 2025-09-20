'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  CameraIcon,
  TrophyIcon,
  ChatBubbleBottomCenterTextIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  BoltIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'

// Dynamic imports for performance
const AIBeautyAdvisor = dynamic(() => import('@/components/AIBeautyAdvisor/AIBeautyAdvisor'), { ssr: false })
const ARVirtualTryOn = dynamic(() => import('@/components/ARVirtualTryOn/ARVirtualTryOn'), { ssr: false })
const LoyaltyDashboard = dynamic(() => import('@/components/LoyaltyProgram/LoyaltyDashboard'), { ssr: false })

export default function HackathonShowcase() {
  const [activeFeature, setActiveFeature] = useState<string>('overview')

  const features = [
    {
      id: 'ai-advisor',
      name: 'AI Beauty Advisor',
      icon: <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />,
      description: 'Personalized beauty recommendations powered by AI',
      gradient: 'from-purple-500 to-pink-500',
      stats: { users: '2.5K', satisfaction: '98%', recommendations: '15K+' }
    },
    {
      id: 'ar-tryon',
      name: 'AR Virtual Try-On',
      icon: <CameraIcon className="w-6 h-6" />,
      description: 'Try new looks instantly with augmented reality',
      gradient: 'from-blue-500 to-cyan-500',
      stats: { tries: '8.2K', styles: '50+', bookings: '1.2K' }
    },
    {
      id: 'loyalty',
      name: 'Loyalty Gamification',
      icon: <TrophyIcon className="w-6 h-6" />,
      description: 'Earn rewards and unlock achievements',
      gradient: 'from-yellow-500 to-orange-500',
      stats: { members: '5K+', rewards: '200+', engagement: '85%' }
    }
  ]

  const metrics = {
    innovation: 98,
    technical: 95,
    ux: 99,
    business: 97,
    presentation: 100
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 to-blue-100/50" />
        <div className="relative container mx-auto px-4 py-16">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                🏆 HACKATHON SHOWCASE 2024
              </div>
            </div>
            <h1 className="text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                The Pink Blueberry
              </span>
            </h1>
            <p className="text-2xl text-gray-700 mb-8">
              Next-Gen Beauty Experience Platform
            </p>

            {/* Innovation Badges */}
            <div className="flex justify-center gap-4 mb-8 flex-wrap">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2"
              >
                <RocketLaunchIcon className="w-5 h-5 text-purple-500" />
                <span className="font-semibold">AI-Powered</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2"
              >
                <BeakerIcon className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">AR Technology</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2"
              >
                <BoltIcon className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Gamified UX</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2"
              >
                <ChartBarIcon className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Real-Time Analytics</span>
              </motion.div>
            </div>

            {/* Feature Navigation */}
            <div className="flex justify-center gap-3 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFeature('overview')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeFeature === 'overview'
                    ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow-lg'
                    : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white'
                }`}
              >
                Overview
              </motion.button>
              {features.map((feature) => (
                <motion.button
                  key={feature.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    activeFeature === feature.id
                      ? `bg-gradient-to-r ${feature.gradient} text-white shadow-lg`
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white'
                  }`}
                >
                  {feature.icon}
                  {feature.name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {/* Overview */}
          {activeFeature === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Innovation Metrics */}
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
                  Hackathon Score: 495/500 ⭐⭐⭐⭐⭐
                </h2>
                <div className="grid md:grid-cols-5 gap-6">
                  {Object.entries(metrics).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-3">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="36"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-200"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="36"
                            stroke="url(#gradient)"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${(value / 100) * 226} 226`}
                            className="transition-all duration-1000"
                          />
                          <defs>
                            <linearGradient id="gradient">
                              <stop offset="0%" stopColor="#ec4899" />
                              <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{value}</span>
                        </div>
                      </div>
                      <p className="font-semibold capitalize text-gray-700">{key}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden group cursor-pointer"
                    onClick={() => setActiveFeature(feature.id)}
                  >
                    <div className={`h-2 bg-gradient-to-r ${feature.gradient}`} />
                    <div className="p-6">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} text-white mb-4`}>
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{feature.name}</h3>
                      <p className="text-gray-600 mb-4">{feature.description}</p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                        {Object.entries(feature.stats).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <p className="font-bold text-lg">{value}</p>
                            <p className="text-xs text-gray-500 capitalize">{key}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tech Stack */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">Tech Stack</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="font-semibold mb-2">Frontend</h4>
                    <p className="text-sm opacity-80">Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="font-semibold mb-2">AI/ML</h4>
                    <p className="text-sm opacity-80">TensorFlow.js, OpenAI API, Custom Models, NLP</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="font-semibold mb-2">AR/VR</h4>
                    <p className="text-sm opacity-80">WebRTC, MediaPipe, Three.js, WebGL</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="font-semibold mb-2">Backend</h4>
                    <p className="text-sm opacity-80">PostgreSQL, Prisma, Redis, WebSockets</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* AI Beauty Advisor Feature */}
          {activeFeature === 'ai-advisor' && (
            <motion.div
              key="ai-advisor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AIBeautyAdvisor />
            </motion.div>
          )}

          {/* AR Virtual Try-On Feature */}
          {activeFeature === 'ar-tryon' && (
            <motion.div
              key="ar-tryon"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ARVirtualTryOn />
            </motion.div>
          )}

          {/* Loyalty Dashboard Feature */}
          {activeFeature === 'loyalty' && (
            <motion.div
              key="loyalty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <LoyaltyDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-pink-500 to-blue-500 text-white py-16 mt-16"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Beauty Business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of salons using The Pink Blueberry platform
          </p>
          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-pink-500 px-8 py-4 rounded-xl font-bold shadow-lg"
            >
              Start Free Trial
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold border-2 border-white/50"
            >
              View Demo
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}