'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrophyIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  GiftIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import confetti from 'canvas-confetti'

// Types from our loyalty.ts
interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  progress: number
  target: number
  completed: boolean
  pointsReward: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: Date
}

interface TierInfo {
  name: string
  minPoints: number
  maxPoints: number | null
  perks: string[]
  color: string
  gradient: string
  icon: React.ReactNode
}

const tiers: TierInfo[] = [
  {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 499,
    perks: ['5% off services', 'Birthday discount'],
    color: '#CD7F32',
    gradient: 'from-amber-600 to-amber-800',
    icon: <StarIcon className="w-6 h-6" />
  },
  {
    name: 'Silver',
    minPoints: 500,
    maxPoints: 1499,
    perks: ['10% off services', 'Priority booking', 'Free product samples'],
    color: '#C0C0C0',
    gradient: 'from-gray-400 to-gray-600',
    icon: <StarIcon className="w-6 h-6" />
  },
  {
    name: 'Gold',
    minPoints: 1500,
    maxPoints: 2999,
    perks: ['15% off services', 'VIP events', 'Complimentary treatments'],
    color: '#FFD700',
    gradient: 'from-yellow-400 to-yellow-600',
    icon: <StarSolidIcon className="w-6 h-6" />
  },
  {
    name: 'Diamond',
    minPoints: 3000,
    maxPoints: null,
    perks: ['20% off services', 'Exclusive stylist access', 'Luxury gift sets', 'Concierge service'],
    color: '#B9F2FF',
    gradient: 'from-cyan-400 to-blue-600',
    icon: <SparklesIcon className="w-6 h-6" />
  }
]

export default function LoyaltyDashboard() {
  const [currentPoints, setCurrentPoints] = useState(1247)
  const [lifetimePoints, setLifetimePoints] = useState(2840)
  const [currentTier, setCurrentTier] = useState(1) // Silver
  const [streak, setStreak] = useState(12)
  const [animatedPoints, setAnimatedPoints] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [selectedReward, setSelectedReward] = useState<string | null>(null)

  const currentTierInfo = tiers[currentTier]
  const nextTierInfo = tiers[currentTier + 1]
  const pointsToNextTier = nextTierInfo ? nextTierInfo.minPoints - currentPoints : 0
  const progressPercentage = nextTierInfo
    ? ((currentPoints - currentTierInfo.minPoints) / (nextTierInfo.minPoints - currentTierInfo.minPoints)) * 100
    : 100

  // Achievements data
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      name: 'First Timer',
      description: 'Complete your first visit',
      icon: <RocketLaunchIcon className="w-8 h-8" />,
      progress: 1,
      target: 1,
      completed: true,
      pointsReward: 50,
      rarity: 'common',
      unlockedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Streak Master',
      description: 'Visit 10 times in 3 months',
      icon: <FireIcon className="w-8 h-8" />,
      progress: 8,
      target: 10,
      completed: false,
      pointsReward: 200,
      rarity: 'rare'
    },
    {
      id: '3',
      name: 'Big Spender',
      description: 'Spend $1000 total',
      icon: <TrophyIcon className="w-8 h-8" />,
      progress: 847,
      target: 1000,
      completed: false,
      pointsReward: 500,
      rarity: 'epic'
    },
    {
      id: '4',
      name: 'Social Butterfly',
      description: 'Refer 5 friends',
      icon: <UserGroupIcon className="w-8 h-8" />,
      progress: 3,
      target: 5,
      completed: false,
      pointsReward: 300,
      rarity: 'rare'
    },
    {
      id: '5',
      name: 'Transformation Queen',
      description: 'Try 10 different services',
      icon: <SparklesIcon className="w-8 h-8" />,
      progress: 7,
      target: 10,
      completed: false,
      pointsReward: 400,
      rarity: 'epic'
    },
    {
      id: '6',
      name: 'Legendary Client',
      description: 'Reach Diamond tier',
      icon: <BoltIcon className="w-8 h-8" />,
      progress: currentPoints,
      target: 3000,
      completed: false,
      pointsReward: 1000,
      rarity: 'legendary'
    }
  ])

  // Rewards catalog
  const rewards = [
    { id: '1', name: 'Free Blowout', points: 500, category: 'service', available: true },
    { id: '2', name: '$20 Service Credit', points: 400, category: 'discount', available: true },
    { id: '3', name: 'Luxury Hair Mask', points: 300, category: 'product', available: true },
    { id: '4', name: 'VIP Spa Day', points: 2000, category: 'exclusive', available: currentTier >= 2 },
    { id: '5', name: 'Birthday Makeover', points: 800, category: 'special', available: true },
    { id: '6', name: 'Friend Pass (2 for 1)', points: 600, category: 'social', available: true }
  ]

  // Animate points counter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (animatedPoints < currentPoints) {
        setAnimatedPoints(prev => Math.min(prev + 17, currentPoints))
      }
    }, 20)
    return () => clearTimeout(timer)
  }, [animatedPoints, currentPoints])

  // Simulate earning points
  const earnPoints = (amount: number) => {
    const newPoints = currentPoints + amount
    setCurrentPoints(newPoints)

    // Check for tier upgrade
    if (nextTierInfo && newPoints >= nextTierInfo.minPoints) {
      setShowLevelUp(true)
      setCurrentTier(prev => prev + 1)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#3b82f6', '#f59e0b']
      })
      setTimeout(() => setShowLevelUp(false), 5000)
    }
  }

  // Recent activity
  const recentActivity = [
    { date: 'Today', action: 'Earned 50 points', detail: 'Hair Color Service' },
    { date: 'Yesterday', action: 'Achievement Unlocked', detail: 'First Timer Badge' },
    { date: '3 days ago', action: 'Redeemed Reward', detail: 'Free Product Sample' },
    { date: '1 week ago', action: 'Earned 100 points', detail: 'Full Service Package' },
    { date: '2 weeks ago', action: 'Streak Bonus', detail: '+25 bonus points' }
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600'
      case 'rare': return 'from-blue-400 to-blue-600'
      case 'epic': return 'from-purple-400 to-purple-600'
      case 'legendary': return 'from-yellow-400 to-yellow-600'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent mb-4">
            Your Beauty Rewards Journey
          </h1>
          <p className="text-gray-600 text-lg">
            Earn points, unlock achievements, and enjoy exclusive perks!
          </p>
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Points & Tier */}
          <div className="lg:col-span-1 space-y-6">
            {/* Points Balance Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-xl p-6"
            >
              <div className="text-center">
                <p className="text-gray-600 mb-2">Current Balance</p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <SparklesIcon className="w-8 h-8 text-yellow-500" />
                  <motion.span
                    key={animatedPoints}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent"
                  >
                    {animatedPoints.toLocaleString()}
                  </motion.span>
                </div>

                {/* Tier Status */}
                <div className={`bg-gradient-to-r ${currentTierInfo.gradient} text-white rounded-2xl p-4 mb-4`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {currentTierInfo.icon}
                    <span className="text-2xl font-bold">{currentTierInfo.name}</span>
                  </div>
                  <p className="text-sm opacity-90">Member since Jan 2024</p>
                </div>

                {/* Progress to Next Tier */}
                {nextTierInfo && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>{currentTierInfo.name}</span>
                      <span>{nextTierInfo.name}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${nextTierInfo.gradient}`}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {pointsToNextTier} points to {nextTierInfo.name}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Streak Counter */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 font-semibold">Visit Streak</p>
                  <div className="flex items-center gap-2 mt-2">
                    <FireIcon className="w-10 h-10 text-orange-500" />
                    <span className="text-4xl font-bold text-orange-600">{streak}</span>
                    <span className="text-gray-600">days</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Next Bonus</p>
                  <p className="font-bold text-orange-600">+50 pts @ 15 days</p>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl shadow-xl p-6"
            >
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => earnPoints(50)}
                  className="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
                >
                  Check In Today (+50 pts)
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                  Refer a Friend
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                  Write a Review
                </button>
              </div>
            </motion.div>
          </div>

          {/* Middle Column - Achievements */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Achievements</h2>
                <span className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  {achievements.filter(a => a.completed).length}/{achievements.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-4 rounded-2xl border-2 ${
                      achievement.completed
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400'
                        : 'bg-gray-50 border-gray-200'
                    } cursor-pointer`}
                  >
                    {/* Rarity Badge */}
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br ${getRarityColor(achievement.rarity)}`} />

                    <div className={`mb-3 ${achievement.completed ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {achievement.icon}
                    </div>
                    <h4 className={`font-semibold text-sm mb-1 ${achievement.completed ? 'text-gray-800' : 'text-gray-500'}`}>
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>

                    {/* Progress Bar */}
                    {!achievement.completed && (
                      <div>
                        <div className="bg-gray-200 rounded-full h-2 mb-1 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                            className="h-full bg-gradient-to-r from-pink-500 to-blue-500"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {achievement.progress}/{achievement.target}
                        </p>
                      </div>
                    )}

                    {achievement.completed && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <StarSolidIcon className="w-4 h-4" />
                        <span className="text-xs font-bold">+{achievement.pointsReward} pts</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Rewards & Activity */}
          <div className="lg:col-span-1 space-y-6">
            {/* Rewards Catalog */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Rewards Catalog</h3>
                <GiftIcon className="w-6 h-6 text-pink-500" />
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {rewards.map((reward) => (
                  <motion.div
                    key={reward.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-xl border-2 ${
                      reward.available && currentPoints >= reward.points
                        ? 'border-pink-300 bg-pink-50 cursor-pointer'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                    onClick={() => reward.available && currentPoints >= reward.points && setSelectedReward(reward.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-sm">{reward.name}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          <SparklesIcon className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-bold text-gray-700">{reward.points} pts</span>
                        </div>
                      </div>
                      {reward.available && currentPoints >= reward.points && (
                        <button className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                          Redeem
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-3xl shadow-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Recent Activity</h3>
                <ChartBarIcon className="w-6 h-6 text-blue-500" />
              </div>

              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 mt-2" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.detail}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.date}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Special Offers */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-pink-100 to-blue-100 rounded-3xl p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <BoltIcon className="w-6 h-6 text-yellow-500" />
                <h3 className="font-bold text-lg">Double Points Weekend!</h3>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Earn 2x points on all services this weekend only!
              </p>
              <div className="bg-white/70 rounded-xl p-3">
                <p className="text-xs text-gray-600 mb-1">Ends in:</p>
                <p className="text-xl font-bold text-pink-600">2 days 14 hours</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Level Up Modal */}
        <AnimatePresence>
          {showLevelUp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
              >
                <TrophyIcon className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Level Up!</h2>
                <p className="text-xl mb-4">Welcome to <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">{currentTierInfo.name} Tier!</span></p>
                <div className="space-y-2 mb-6">
                  <p className="font-semibold">New Perks Unlocked:</p>
                  {currentTierInfo.perks.map((perk, index) => (
                    <div key={index} className="flex items-center gap-2 justify-center">
                      <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">{perk}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowLevelUp(false)}
                  className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg"
                >
                  Awesome!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #ec4899, #3b82f6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #db2777, #2563eb);
        }
      `}</style>
    </div>
  )
}