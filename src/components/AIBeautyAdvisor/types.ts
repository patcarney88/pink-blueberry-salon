// Types for AI Beauty Advisor Component

export type HairType = 'straight' | 'wavy' | 'curly' | 'coily';
export type HairLength = 'short' | 'medium' | 'long' | 'extra-long';
export type HairConcern = 'damage' | 'dryness' | 'oiliness' | 'frizz' | 'thinning' | 'color-fade';
export type StylePreference = 'classic' | 'trendy' | 'edgy' | 'natural' | 'glamorous';
export type ServiceCategory = 'cut' | 'color' | 'treatment' | 'styling' | 'extension';

export interface UserProfile {
  id?: string;
  name: string;
  hairType?: HairType;
  hairLength?: HairLength;
  hairConcerns?: HairConcern[];
  stylePreference?: StylePreference;
  lastVisit?: Date;
  favoriteServices?: Service[];
  consultationHistory?: Consultation[];
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  recommendations?: ServiceRecommendation[];
  products?: ProductRecommendation[];
  isTyping?: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  price: string;
  duration: string;
  image?: string;
  popular?: boolean;
  trending?: boolean;
}

export interface ServiceRecommendation extends Service {
  matchScore: number;
  reason: string;
  availableSlots?: Date[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: string;
  description: string;
  benefits: string[];
  image?: string;
  inStock: boolean;
}

export interface ProductRecommendation extends Product {
  reason: string;
  crossSellWith?: string[];
}

export interface Consultation {
  id: string;
  date: Date;
  messages: Message[];
  recommendations: ServiceRecommendation[];
  products: ProductRecommendation[];
  bookingMade?: boolean;
  serviceBooked?: string;
}

export interface QuestionnaireStep {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text';
  options?: {
    value: string;
    label: string;
    icon?: string;
    description?: string;
  }[];
  required?: boolean;
}

export interface AIResponse {
  message: string;
  recommendations?: ServiceRecommendation[];
  products?: ProductRecommendation[];
  followUpQuestions?: string[];
}