import { Product } from '@/types/product'

export const mockProducts: Product[] = [
  // Hair Care Products
  {
    id: 'hc-001',
    name: 'Luxury Hydrating Shampoo',
    description: 'Professional-grade moisturizing shampoo infused with argan oil and keratin proteins. Gently cleanses while restoring natural moisture balance, leaving hair silky smooth and manageable.',
    shortDescription: 'Professional moisturizing shampoo with argan oil',
    price: 45,
    originalPrice: 55,
    discountPercentage: 18,
    category: 'hair-care',
    subcategory: 'Shampoo',
    brand: 'Pink Blueberry Professional',
    images: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1556228578-dd6c9b430205?w=600&h=600&fit=crop',
        alt: 'Luxury Hydrating Shampoo bottle',
        isPrimary: true
      }
    ],
    features: ['Sulfate-free formula', 'Infused with argan oil', 'Keratin protein complex', 'Color-safe'],
    reviews: [
      {
        id: 'rev-1',
        customerName: 'Sarah M.',
        rating: 5,
        title: 'Amazing results!',
        comment: 'My hair has never felt so soft and manageable. The argan oil really makes a difference.',
        date: '2024-01-15',
        verified: true,
        helpful: 12
      }
    ],
    rating: 4.8,
    reviewCount: 127,
    inStock: true,
    stockQuantity: 50,
    tags: ['sulfate-free', 'argan-oil', 'professional'],
    isBestseller: true
  },
  {
    id: 'hc-002',
    name: 'Volumizing Conditioner',
    description: 'Lightweight conditioning treatment that adds body and volume without weighing hair down. Enriched with biotin and collagen peptides.',
    shortDescription: 'Lightweight conditioner for volume and body',
    price: 42,
    category: 'hair-care',
    subcategory: 'Conditioner',
    brand: 'Pink Blueberry Professional',
    images: [
      {
        id: 'img-2',
        url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=600&fit=crop',
        alt: 'Volumizing Conditioner',
        isPrimary: true
      }
    ],
    features: ['Biotin enriched', 'Collagen peptides', 'Lightweight formula', 'Volume enhancing'],
    reviews: [],
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    stockQuantity: 35,
    tags: ['volume', 'biotin', 'lightweight']
  },
  {
    id: 'hc-003',
    name: 'Curl Defining Cream',
    description: 'Rich styling cream that enhances natural curl pattern while controlling frizz. Provides long-lasting hold with a natural finish.',
    shortDescription: 'Styling cream for defined, frizz-free curls',
    price: 38,
    category: 'hair-care',
    subcategory: 'Styling',
    brand: 'Pink Blueberry Professional',
    images: [
      {
        id: 'img-3',
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
        alt: 'Curl Defining Cream',
        isPrimary: true
      }
    ],
    features: ['Frizz control', 'Natural hold', 'Curl enhancement', 'Humidity resistant'],
    reviews: [],
    rating: 4.7,
    reviewCount: 45,
    inStock: true,
    stockQuantity: 28,
    tags: ['curls', 'styling', 'frizz-control'],
    isNew: true
  },

  // Organic Soaps
  {
    id: 'os-001',
    name: 'Lavender Honey Artisan Soap',
    description: 'Handcrafted artisan soap made with organic lavender essential oil and raw honey. Creates a luxurious, creamy lather.',
    shortDescription: 'Handmade soap with organic lavender and honey',
    price: 28,
    category: 'organic-soaps',
    subcategory: 'Artisan Soaps',
    brand: 'Pink Blueberry Naturals',
    images: [
      {
        id: 'img-4',
        url: 'https://images.unsplash.com/photo-1582619600980-2e581e3ab9b9?w=600&h=600&fit=crop',
        alt: 'Lavender Honey Soap',
        isPrimary: true
      }
    ],
    features: ['100% organic ingredients', 'Handcrafted', 'Moisturizing', 'Natural fragrance'],
    reviews: [
      {
        id: 'rev-2',
        customerName: 'Maria K.',
        rating: 5,
        title: 'Beautiful scent',
        comment: 'This soap smells amazing and leaves my skin so soft!',
        date: '2024-01-18',
        verified: true,
        helpful: 15
      }
    ],
    rating: 4.9,
    reviewCount: 203,
    inStock: true,
    stockQuantity: 42,
    tags: ['organic', 'handmade', 'lavender', 'moisturizing'],
    isOrganic: true,
    isBestseller: true
  },
  {
    id: 'os-002',
    name: 'Charcoal Detox Bar',
    description: 'Deep cleansing soap bar infused with activated charcoal and tea tree oil. Perfect for oily and acne-prone skin.',
    shortDescription: 'Detoxifying soap with activated charcoal',
    price: 32,
    category: 'organic-soaps',
    subcategory: 'Specialty Soaps',
    brand: 'Pink Blueberry Naturals',
    images: [
      {
        id: 'img-5',
        url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop',
        alt: 'Charcoal Detox Bar',
        isPrimary: true
      }
    ],
    features: ['Activated charcoal', 'Tea tree oil', 'Deep cleansing', 'Acne-fighting'],
    reviews: [],
    rating: 4.5,
    reviewCount: 67,
    inStock: true,
    stockQuantity: 25,
    tags: ['charcoal', 'detox', 'acne'],
    isOrganic: true
  },

  // Professional Tools
  {
    id: 'pt-001',
    name: 'Professional Ionic Hair Dryer',
    description: 'Salon-quality ionic hair dryer with ceramic tourmaline technology. Reduces drying time by 50% while minimizing heat damage.',
    shortDescription: 'Professional ionic dryer with ceramic technology',
    price: 185,
    originalPrice: 220,
    discountPercentage: 16,
    category: 'professional-tools',
    subcategory: 'Hair Dryers',
    brand: 'Pink Blueberry Pro',
    images: [
      {
        id: 'img-6',
        url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&h=600&fit=crop',
        alt: 'Professional Hair Dryer',
        isPrimary: true
      }
    ],
    features: ['Ionic technology', 'Ceramic tourmaline', '3 heat settings', '2 speed settings'],
    reviews: [
      {
        id: 'rev-3',
        customerName: 'Jessica R.',
        rating: 5,
        title: 'Professional quality',
        comment: 'Dries my hair so much faster and it feels healthier too!',
        date: '2024-01-12',
        verified: true,
        helpful: 23
      }
    ],
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    stockQuantity: 15,
    tags: ['ionic', 'professional', 'fast-drying']
  },
  {
    id: 'pt-002',
    name: 'Boar Bristle Round Brush Set',
    description: 'Premium boar bristle round brushes in three essential sizes. Perfect for creating volume and adding shine.',
    shortDescription: 'Professional boar bristle brush set (3 sizes)',
    price: 95,
    category: 'professional-tools',
    subcategory: 'Brushes',
    brand: 'Pink Blueberry Pro',
    images: [
      {
        id: 'img-7',
        url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=600&fit=crop',
        alt: 'Boar Bristle Brush Set',
        isPrimary: true
      }
    ],
    features: ['100% boar bristles', 'Ceramic barrel', 'Anti-static', 'Heat resistant'],
    reviews: [],
    rating: 4.8,
    reviewCount: 78,
    inStock: true,
    stockQuantity: 22,
    tags: ['boar-bristle', 'professional', 'volume', 'set']
  },

  // Gift Sets
  {
    id: 'gs-001',
    name: 'Ultimate Hair Care Luxury Set',
    description: 'Complete hair care collection featuring our bestselling shampoo, conditioner, styling cream, and professional brush.',
    shortDescription: 'Complete luxury hair care collection',
    price: 150,
    originalPrice: 185,
    discountPercentage: 19,
    category: 'gift-sets',
    subcategory: 'Hair Care Sets',
    brand: 'Pink Blueberry Collection',
    images: [
      {
        id: 'img-8',
        url: 'https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=600&h=600&fit=crop',
        alt: 'Hair Care Gift Set',
        isPrimary: true
      }
    ],
    features: ['Luxury gift packaging', 'Bestselling products', 'Perfect for gifting', 'Complete routine'],
    reviews: [
      {
        id: 'rev-4',
        customerName: 'Rachel D.',
        rating: 5,
        title: 'Perfect gift!',
        comment: 'Bought this for my sister and she absolutely loved it!',
        date: '2024-01-10',
        verified: true,
        helpful: 31
      }
    ],
    rating: 4.9,
    reviewCount: 234,
    inStock: true,
    stockQuantity: 18,
    tags: ['gift-set', 'luxury', 'complete-care'],
    isBestseller: true
  },
  {
    id: 'gs-002',
    name: 'Organic Spa Experience Set',
    description: 'Indulgent spa set featuring handcrafted organic soaps, luxury bath salts, and moisturizing body oil.',
    shortDescription: 'Luxury organic spa collection',
    price: 78,
    category: 'gift-sets',
    subcategory: 'Spa Sets',
    brand: 'Pink Blueberry Naturals',
    images: [
      {
        id: 'img-9',
        url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=600&fit=crop',
        alt: 'Organic Spa Set',
        isPrimary: true
      }
    ],
    features: ['100% organic ingredients', 'Handcrafted soaps', 'Bath salts', 'Body oil'],
    reviews: [],
    rating: 4.6,
    reviewCount: 92,
    inStock: true,
    stockQuantity: 31,
    tags: ['organic', 'spa', 'relaxation', 'natural'],
    isOrganic: true,
    isNew: true
  }
]

export const getFeaturedProducts = (): Product[] => {
  return mockProducts.filter(product => product.isBestseller || product.isNew).slice(0, 8)
}

export const getProductsByCategory = (category: string): Product[] => {
  return mockProducts.filter(product => product.category === category)
}

export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find(product => product.id === id)
}

export const getAllCategories = (): string[] => {
  return [...new Set(mockProducts.map(product => product.category))]
}

export const getBrands = (): string[] => {
  return [...new Set(mockProducts.map(product => product.brand))]
}

export const searchProducts = (query: string): Product[] => {
  const lowercaseQuery = query.toLowerCase()
  return mockProducts.filter(product =>
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    product.brand.toLowerCase().includes(lowercaseQuery)
  )
}