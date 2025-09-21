'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Gift, Target, TrendingUp, Award, Zap, Crown } from 'lucide-react'
import AnimatedButton from '@/components/ui/AnimatedButton'
import confetti from 'canvas-confetti'

interface Badge {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  points: number
  unlocked: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  claimed: boolean
  category: 'discount' | 'service' | 'product'
}

interface Level {
  level: number
  name: string
  minPoints: number
  maxPoints: number
  perks: string[]
}

const levels: Level[] = [
  { level: 1, name: 'Bronze Beauty', minPoints: 0, maxPoints: 499, perks: ['5% discount', 'Birthday reward'] },
  { level: 2, name: 'Silver Sensation', minPoints: 500, maxPoints: 1499, perks: ['10% discount', 'Priority booking', 'Free consultation'] },
  { level: 3, name: 'Gold Glamour', minPoints: 1500, maxPoints: 2999, perks: ['15% discount', 'VIP events', 'Complimentary upgrades'] },
  { level: 4, name: 'Platinum Princess', minPoints: 3000, maxPoints: 4999, perks: ['20% discount', 'Personal stylist', 'Exclusive products'] },
  { level: 5, name: 'Diamond Diva', minPoints: 5000, maxPoints: Infinity, perks: ['25% discount', 'Concierge service', 'Unlimited perks'] },
]

const badges: Badge[] = [
  { id: 'first-visit', name: 'First Timer', description: 'Complete your first visit', icon: <Star className="w-6 h-6" />, points: 100, unlocked: true, rarity: 'common' },
  { id: 'loyal-customer', name: 'Loyal Customer', description: 'Visit 5 times', icon: <Trophy className="w-6 h-6" />, points: 250, unlocked: true, rarity: 'rare' },
  { id: 'big-spender', name: 'Big Spender', description: 'Spend $500+', icon: <Gift className="w-6 h-6" />, points: 500, unlocked: false, rarity: 'epic' },
  { id: 'referrer', name: 'Influencer', description: 'Refer 3 friends', icon: <Target className="w-6 h-6" />, points: 300, unlocked: false, rarity: 'rare' },
  { id: 'streak', name: 'Streak Master', description: '30-day visit streak', icon: <Zap className="w-6 h-6" />, points: 750, unlocked: false, rarity: 'legendary' },
  { id: 'vip', name: 'VIP Elite', description: 'Reach Diamond level', icon: <Crown className="w-6 h-6" />, points: 1000, unlocked: false, rarity: 'legendary' },
]

const rewards: Reward[] = [
  { id: 'r1', name: '20% Off Next Visit', description: 'Save on any service', pointsCost: 500, claimed: false, category: 'discount' },
  { id: 'r2', name: 'Free Hair Treatment', description: 'Complimentary deep conditioning', pointsCost: 800, claimed: false, category: 'service' },
  { id: 'r3', name: 'Luxury Product Set', description: 'Premium hair care bundle', pointsCost: 1200, claimed: false, category: 'product' },
  { id: 'r4', name: 'Spa Day Package', description: 'Full relaxation experience', pointsCost: 2000, claimed: false, category: 'service' },
  { id: 'r5', name: 'Birthday Makeover', description: 'Complete transformation', pointsCost: 1500, claimed: false, category: 'service' },
]

export default function LoyaltyDashboard() {
  const [isOpen, setIsOpen] = useState(false)
  const [userPoints, setUserPoints] = useState(1250)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'badges' | 'rewards'>('overview')
  const [claimedReward, setClaimedReward] = useState<Reward | null>(null)

  const currentLevel = levels.find(l => userPoints >= l.minPoints && userPoints <= l.maxPoints) || levels[0]
  const nextLevel = levels[currentLevel.level] || null
  const progressToNext = nextLevel 
    ? ((userPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100

  const claimReward = (reward: Reward) => {
    if (userPoints >= reward.pointsCost && !reward.claimed) {
      setUserPoints(prev => prev - reward.pointsCost)
      setClaimedReward(reward)
      
      // Celebration effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#8b5cf6', '#3b82f6']
      })
      
      setTimeout(() => setClaimedReward(null), 3000)
    }
  }

  const earnPoints = (amount: number, reason: string) => {
    setUserPoints(prev => prev + amount)
    
    // Show points animation
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#fbbf24', '#f59e0b']
    })
  }

  return (
    <>
      {/* Floating Loyalty Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-52 right-6 z-40 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full p-4 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2 }}
      >
        <Trophy className="w-6 h-6" />
        <motion.span 
          className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full px-2 py-1 font-bold"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {userPoints}
        </motion.span>
      </motion.button>

      {/* Loyalty Dashboard Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Level Info */}
              <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold flex items-center gap-2">
                      <Crown className="w-8 h-8" />
                      Loyalty Rewards
                    </h2>
                    <p className="text-yellow-100 mt-1">Level {currentLevel.level}: {currentLevel.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{userPoints}</div>
                    <div className="text-yellow-100">Points</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white/20 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="bg-white h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                {nextLevel && (
                  <p className="text-xs text-yellow-100 mt-2">
                    {nextLevel.minPoints - userPoints} points to {nextLevel.name}
                  </p>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {(['overview', 'badges', 'rewards'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={`flex-1 py-3 px-4 font-semibold transition-all duration-300 ${
                      selectedTab === tab
                        ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-6 overflow-y-auto max-h-[500px]">
                {/* Overview Tab */}
                {selectedTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Current Level Perks */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        Your Current Perks
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {currentLevel.perks.map((perk, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Points History */}
                    <div>
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Recent Activity
                      </h3>
                      <div className="space-y-2">
                        {[
                          { date: 'Today', action: 'Hair Treatment', points: '+150' },
                          { date: 'Yesterday', action: 'Daily Check-in', points: '+10' },
                          { date: '3 days ago', action: 'Product Purchase', points: '+75' },
                          { date: 'Last week', action: 'Friend Referral', points: '+200' },
                        ].map((activity, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                            <div>
                              <div className="font-medium">{activity.action}</div>
                              <div className="text-xs text-gray-500">{activity.date}</div>
                            </div>
                            <span className={`font-bold ${
                              activity.points.startsWith('+') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {activity.points} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4">
                      <AnimatedButton
                        onClick={() => earnPoints(10, 'Daily check-in')}
                        variant="secondary"
                        icon={<Zap className="w-4 h-4" />}
                      >
                        Daily Check-in (+10)
                      </AnimatedButton>
                      <AnimatedButton
                        variant="secondary"
                        icon={<Gift className="w-4 h-4" />}
                      >
                        Spin the Wheel
                      </AnimatedButton>
                    </div>
                  </div>
                )}

                {/* Badges Tab */}
                {selectedTab === 'badges' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {badges.map(badge => (
                      <motion.div
                        key={badge.id}
                        className={`relative p-4 rounded-xl border-2 text-center transition-all duration-300 ${
                          badge.unlocked
                            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-400'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                        }`}
                        whileHover={{ scale: badge.unlocked ? 1.05 : 1 }}
                      >
                        {/* Rarity Indicator */}
                        <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold text-white ${
                          badge.rarity === 'legendary' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
                          badge.rarity === 'epic' ? 'bg-purple-600' :
                          badge.rarity === 'rare' ? 'bg-blue-600' :
                          'bg-gray-600'
                        }`}>
                          {badge.rarity.toUpperCase()}
                        </div>

                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                          badge.unlocked ? 'bg-yellow-400 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                        }`}>
                          {badge.icon}
                        </div>
                        <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{badge.description}</p>
                        <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          {badge.points} pts
                        </div>
                        {badge.unlocked && (
                          <motion.div
                            className="absolute inset-0 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.3, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <div className="w-full h-full bg-gradient-to-r from-yellow-400/20 to-transparent rounded-xl" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Rewards Tab */}
                {selectedTab === 'rewards' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {rewards.map(reward => (
                      <motion.div
                        key={reward.id}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          reward.claimed
                            ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-50'
                            : userPoints >= reward.pointsCost
                            ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-400 hover:border-purple-500'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                        }`}
                        whileHover={{ scale: !reward.claimed && userPoints >= reward.pointsCost ? 1.02 : 1 }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold mb-1">{reward.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{reward.description}</p>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-bold ${
                            reward.category === 'discount' ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' :
                            reward.category === 'service' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                            'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          }`}>
                            {reward.category}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span className="font-bold text-purple-600 dark:text-purple-400">
                              {reward.pointsCost} pts
                            </span>
                          </div>
                          
                          {!reward.claimed && (
                            <AnimatedButton
                              onClick={() => claimReward(reward)}
                              size="sm"
                              variant={userPoints >= reward.pointsCost ? 'primary' : 'ghost'}
                              disabled={userPoints < reward.pointsCost}
                              gradient={userPoints >= reward.pointsCost}
                            >
                              {userPoints >= reward.pointsCost ? 'Claim' : 'Locked'}
                            </AnimatedButton>
                          )}
                          
                          {reward.claimed && (
                            <span className="text-sm font-bold text-gray-500">Claimed</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <AnimatedButton
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                >
                  Close
                </AnimatedButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward Claimed Toast */}
      <AnimatePresence>
        {claimedReward && (
          <motion.div
            className="fixed top-20 right-6 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl shadow-2xl"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
          >
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6" />
              <div>
                <div className="font-bold">Reward Claimed!</div>
                <div className="text-sm text-green-100">{claimedReward.name}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}