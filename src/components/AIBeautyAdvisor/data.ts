// Mock data and AI logic for Beauty Advisor

import { Service, Product, QuestionnaireStep, HairType, HairLength, HairConcern, StylePreference } from './types';

export const services: Service[] = [
  // Cuts
  {
    id: 'cut-1',
    name: 'Signature Precision Cut',
    category: 'cut',
    description: 'Custom tailored haircut with consultation and styling',
    price: '$85',
    duration: '60 min',
    popular: true,
    trending: false,
  },
  {
    id: 'cut-2',
    name: 'Trendy Layer Cut',
    category: 'cut',
    description: 'Modern layered cut for movement and volume',
    price: '$95',
    duration: '75 min',
    popular: false,
    trending: true,
  },
  {
    id: 'cut-3',
    name: 'Bang Transformation',
    category: 'cut',
    description: 'Expert bang cut and styling',
    price: '$45',
    duration: '30 min',
    popular: false,
    trending: false,
  },
  // Colors
  {
    id: 'color-1',
    name: 'Pink Blueberry Balayage',
    category: 'color',
    description: 'Our signature hand-painted color technique',
    price: '$250',
    duration: '180 min',
    popular: true,
    trending: true,
  },
  {
    id: 'color-2',
    name: 'Full Color Transformation',
    category: 'color',
    description: 'Complete color change with professional consultation',
    price: '$185',
    duration: '150 min',
    popular: false,
    trending: false,
  },
  {
    id: 'color-3',
    name: 'Glossing Treatment',
    category: 'color',
    description: 'Shine-enhancing color gloss for vibrant results',
    price: '$75',
    duration: '45 min',
    popular: false,
    trending: false,
  },
  // Treatments
  {
    id: 'treatment-1',
    name: 'Keratin Smoothing',
    category: 'treatment',
    description: 'Professional smoothing treatment for frizz-free hair',
    price: '$300',
    duration: '240 min',
    popular: true,
    trending: false,
  },
  {
    id: 'treatment-2',
    name: 'Deep Repair Mask',
    category: 'treatment',
    description: 'Intensive repair treatment for damaged hair',
    price: '$95',
    duration: '60 min',
    popular: false,
    trending: false,
  },
  {
    id: 'treatment-3',
    name: 'Scalp Detox Therapy',
    category: 'treatment',
    description: 'Purifying scalp treatment for healthy hair growth',
    price: '$85',
    duration: '45 min',
    popular: false,
    trending: true,
  },
  // Styling
  {
    id: 'style-1',
    name: 'Event Styling',
    category: 'styling',
    description: 'Professional styling for special occasions',
    price: '$120',
    duration: '90 min',
    popular: true,
    trending: false,
  },
  {
    id: 'style-2',
    name: 'Blow Dry Bar',
    category: 'styling',
    description: 'Professional blow dry with styling',
    price: '$55',
    duration: '45 min',
    popular: false,
    trending: false,
  },
  // Extensions
  {
    id: 'ext-1',
    name: 'Luxury Hair Extensions',
    category: 'extension',
    description: 'Premium human hair extensions consultation and application',
    price: '$800+',
    duration: '240 min',
    popular: false,
    trending: true,
  },
];

export const products: Product[] = [
  {
    id: 'prod-1',
    name: 'Repair & Restore Shampoo',
    brand: 'Pink Blueberry Professional',
    type: 'Shampoo',
    price: '$32',
    description: 'Sulfate-free formula for damaged hair',
    benefits: ['Repairs damage', 'Adds shine', 'Color-safe'],
    inStock: true,
  },
  {
    id: 'prod-2',
    name: 'Hydrating Hair Mask',
    brand: 'Pink Blueberry Professional',
    type: 'Treatment',
    price: '$45',
    description: 'Weekly intensive moisture treatment',
    benefits: ['Deep hydration', 'Reduces frizz', 'Strengthens'],
    inStock: true,
  },
  {
    id: 'prod-3',
    name: 'Heat Protection Spray',
    brand: 'Pink Blueberry Professional',
    type: 'Styling',
    price: '$28',
    description: 'Thermal protection up to 450°F',
    benefits: ['Heat protection', 'Adds shine', 'Reduces breakage'],
    inStock: true,
  },
  {
    id: 'prod-4',
    name: 'Volume Boost Mousse',
    brand: 'Pink Blueberry Professional',
    type: 'Styling',
    price: '$26',
    description: 'Lightweight volumizing mousse',
    benefits: ['Adds volume', 'Long-lasting hold', 'No residue'],
    inStock: true,
  },
  {
    id: 'prod-5',
    name: 'Color Protect Serum',
    brand: 'Pink Blueberry Professional',
    type: 'Treatment',
    price: '$38',
    description: 'UV protection for color-treated hair',
    benefits: ['UV protection', 'Color preservation', 'Adds shine'],
    inStock: false,
  },
];

export const questionnaireSteps: QuestionnaireStep[] = [
  {
    id: 'hair-type',
    question: 'What\'s your hair type?',
    type: 'single',
    required: true,
    options: [
      { value: 'straight', label: 'Straight', description: 'Little to no curl pattern' },
      { value: 'wavy', label: 'Wavy', description: 'S-shaped waves' },
      { value: 'curly', label: 'Curly', description: 'Defined curls' },
      { value: 'coily', label: 'Coily', description: 'Tight curls or kinks' },
    ],
  },
  {
    id: 'hair-length',
    question: 'How long is your hair?',
    type: 'single',
    required: true,
    options: [
      { value: 'short', label: 'Short', description: 'Above shoulders' },
      { value: 'medium', label: 'Medium', description: 'Shoulder to mid-back' },
      { value: 'long', label: 'Long', description: 'Mid-back to waist' },
      { value: 'extra-long', label: 'Extra Long', description: 'Below waist' },
    ],
  },
  {
    id: 'hair-concerns',
    question: 'What are your main hair concerns? (Select all that apply)',
    type: 'multiple',
    required: false,
    options: [
      { value: 'damage', label: 'Damage', description: 'Breakage, split ends' },
      { value: 'dryness', label: 'Dryness', description: 'Lack of moisture' },
      { value: 'oiliness', label: 'Oiliness', description: 'Greasy roots' },
      { value: 'frizz', label: 'Frizz', description: 'Unmanageable texture' },
      { value: 'thinning', label: 'Thinning', description: 'Hair loss concerns' },
      { value: 'color-fade', label: 'Color Fade', description: 'Color doesn\'t last' },
    ],
  },
  {
    id: 'style-preference',
    question: 'What\'s your style preference?',
    type: 'single',
    required: true,
    options: [
      { value: 'classic', label: 'Classic', description: 'Timeless and elegant' },
      { value: 'trendy', label: 'Trendy', description: 'Latest fashion forward' },
      { value: 'edgy', label: 'Edgy', description: 'Bold and unconventional' },
      { value: 'natural', label: 'Natural', description: 'Effortless and organic' },
      { value: 'glamorous', label: 'Glamorous', description: 'Red carpet ready' },
    ],
  },
];

// AI recommendation logic
export function generateAIResponse(
  userInput: string,
  userProfile?: Partial<{
    hairType: HairType;
    hairLength: HairLength;
    hairConcerns: HairConcern[];
    stylePreference: StylePreference;
  }>
) {
  const input = userInput.toLowerCase();

  // Keywords detection
  const keywords = {
    damage: ['damage', 'broken', 'split', 'brittle', 'weak'],
    color: ['color', 'dye', 'blonde', 'brunette', 'highlights', 'balayage'],
    cut: ['cut', 'trim', 'layer', 'bang', 'short', 'long'],
    treatment: ['treatment', 'repair', 'hydrate', 'smooth', 'keratin'],
    style: ['style', 'event', 'wedding', 'party', 'date'],
    frizz: ['frizz', 'smooth', 'sleek', 'manageable'],
  };

  let recommendedServices = [];
  let recommendedProducts = [];
  let message = '';

  // Check for damage keywords
  if (keywords.damage.some(k => input.includes(k))) {
    recommendedServices.push({
      ...services.find(s => s.id === 'treatment-2'),
      matchScore: 95,
      reason: 'Perfect for repairing damaged hair',
    });
    recommendedProducts.push({
      ...products.find(p => p.id === 'prod-1'),
      reason: 'Helps repair and restore damaged hair',
    });
    message = "I can see you're concerned about hair damage. Our Deep Repair Mask is perfect for restoring your hair's health! 💫";
  }
  // Check for color keywords
  else if (keywords.color.some(k => input.includes(k))) {
    recommendedServices.push({
      ...services.find(s => s.id === 'color-1'),
      matchScore: 90,
      reason: 'Our signature color service',
    });
    recommendedProducts.push({
      ...products.find(p => p.id === 'prod-5'),
      reason: 'Protects and maintains your color',
    });
    message = "Looking for a color transformation? Our Pink Blueberry Balayage is our most popular color service! 🎨";
  }
  // Check for cut keywords
  else if (keywords.cut.some(k => input.includes(k))) {
    recommendedServices.push({
      ...services.find(s => s.id === 'cut-1'),
      matchScore: 88,
      reason: 'Customized to your face shape and style',
    });
    message = "A fresh cut can make all the difference! Our Signature Precision Cut is tailored just for you ✂️";
  }
  // Check for treatment keywords
  else if (keywords.treatment.some(k => input.includes(k)) || keywords.frizz.some(k => input.includes(k))) {
    recommendedServices.push({
      ...services.find(s => s.id === 'treatment-1'),
      matchScore: 92,
      reason: 'Eliminates frizz for weeks',
    });
    recommendedProducts.push({
      ...products.find(p => p.id === 'prod-2'),
      reason: 'Maintains smooth, hydrated hair',
    });
    message = "For smooth, frizz-free hair, I recommend our Keratin Smoothing treatment. It's a game-changer! ✨";
  }
  // Check for style keywords
  else if (keywords.style.some(k => input.includes(k))) {
    recommendedServices.push({
      ...services.find(s => s.id === 'style-1'),
      matchScore: 85,
      reason: 'Professional styling for your special day',
    });
    recommendedProducts.push({
      ...products.find(p => p.id === 'prod-3'),
      reason: 'Protects your style from heat damage',
    });
    message = "Need stunning hair for a special event? Our Event Styling service will make you look absolutely gorgeous! 👑";
  }
  // Default recommendations based on profile
  else if (userProfile?.hairConcerns?.includes('damage')) {
    recommendedServices.push({
      ...services.find(s => s.id === 'treatment-2'),
      matchScore: 85,
      reason: 'Based on your hair concerns',
    });
    message = "Based on your hair profile, I'd recommend starting with our Deep Repair Mask treatment 💖";
  }
  else {
    // General greeting
    message = "Hi! I'm your AI beauty advisor. Tell me about your hair goals and I'll recommend the perfect services for you! What are you looking for today?";
  }

  return {
    message,
    recommendations: recommendedServices.filter(Boolean).slice(0, 3),
    products: recommendedProducts.filter(Boolean).slice(0, 2),
    followUpQuestions: [
      "What's your biggest hair concern right now?",
      "When was your last salon visit?",
      "Do you have any upcoming events?",
    ],
  };
}

// Generate seasonal recommendations
export function getSeasonalRecommendations() {
  const month = new Date().getMonth();
  const season = month >= 2 && month <= 4 ? 'spring' :
                 month >= 5 && month <= 7 ? 'summer' :
                 month >= 8 && month <= 10 ? 'fall' : 'winter';

  const seasonalTips = {
    spring: {
      message: "Spring is here! Time to refresh your look 🌸",
      services: ['cut-2', 'color-1'],
      tip: "Lighter colors and fresh cuts are trending this season",
    },
    summer: {
      message: "Summer ready hair starts here! ☀️",
      services: ['treatment-1', 'color-3'],
      tip: "Protect your hair from sun damage with our treatments",
    },
    fall: {
      message: "Fall into gorgeous hair! 🍂",
      services: ['color-2', 'treatment-2'],
      tip: "Rich, warm colors are perfect for fall",
    },
    winter: {
      message: "Winter hair care essentials ❄️",
      services: ['treatment-2', 'treatment-1'],
      tip: "Combat dry winter air with deep conditioning",
    },
  };

  return seasonalTips[season];
}