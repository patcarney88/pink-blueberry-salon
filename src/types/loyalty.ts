// Loyalty Program Types

export type TierLevel = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface LoyaltyTier {
  name: TierLevel;
  displayName: string;
  minPoints: number;
  maxPoints: number | null;
  perks: string[];
  color: string;
  gradient: string;
  icon: string;
}

export interface UserLoyalty {
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
  currentTier: TierLevel;
  nextTier: TierLevel | null;
  pointsToNextTier: number;
  memberSince: Date;
  lastActivity: Date;
  currentStreak: number;
  longestStreak: number;
  totalVisits: number;
  totalSpent: number;
}

export interface Transaction {
  id: string;
  date: Date;
  type: 'earned' | 'redeemed' | 'bonus' | 'expired';
  points: number;
  description: string;
  category: string;
  icon?: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'service' | 'product' | 'discount' | 'exclusive';
  imageUrl: string;
  availability: 'available' | 'limited' | 'soldout' | 'locked';
  stock?: number;
  expiresAt?: Date;
  tierRequired?: TierLevel;
  popular?: boolean;
  new?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'streak' | 'spending' | 'social' | 'special';
  progress: number;
  target: number;
  completed: boolean;
  unlockedAt?: Date;
  pointsReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  gradient: string;
}

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  multiplier: number;
  validFrom: Date;
  validUntil: Date;
  conditions?: string[];
  icon: string;
  color: string;
}

export interface LoyaltyNotification {
  id: string;
  type: 'points_earned' | 'tier_upgrade' | 'achievement_unlocked' | 'reward_available' | 'special_offer';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  icon?: string;
}

export interface QRCodeData {
  transactionId: string;
  merchantId: string;
  amount: number;
  timestamp: Date;
  signature: string;
}