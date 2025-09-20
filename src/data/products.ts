import { Product } from '@/contexts/CartContext'

export const hairProducts: Product[] = [
  {
    id: 'shampoo-luxury',
    name: 'Pink Blueberry Luxury Shampoo',
    price: 24.99,
    description: 'Premium sulfate-free shampoo infused with natural berry extracts. Gentle cleansing for all hair types with vitamins and antioxidants.',
    image: '/products/shampoo.jpg',
    category: 'Hair Care'
  },
  {
    id: 'conditioner-deep',
    name: 'Deep Moisturizing Conditioner',
    price: 26.99,
    description: 'Rich, creamy conditioner with argan oil and keratin. Repairs damaged hair and provides long-lasting moisture and shine.',
    image: '/products/conditioner.jpg',
    category: 'Hair Care'
  },
  {
    id: 'styling-gel',
    name: 'Professional Styling Gel',
    price: 18.99,
    description: 'Strong hold styling gel with flexible finish. Perfect for creating lasting styles without flaking or stiffness.',
    image: '/products/styling-gel.jpg',
    category: 'Styling'
  },
  {
    id: 'hair-mask',
    name: 'Intensive Repair Hair Mask',
    price: 32.99,
    description: 'Weekly treatment mask with proteins and natural oils. Deeply nourishes and restores damaged hair to salon-quality softness.',
    image: '/products/hair-mask.jpg',
    category: 'Treatment'
  },
  {
    id: 'hair-serum',
    name: 'Anti-Frizz Hair Serum',
    price: 22.99,
    description: 'Lightweight serum with heat protection. Controls frizz and adds brilliant shine while protecting from styling damage.',
    image: '/products/hair-serum.jpg',
    category: 'Treatment'
  },
  {
    id: 'dry-shampoo',
    name: 'Volumizing Dry Shampoo',
    price: 16.99,
    description: 'Oil-absorbing dry shampoo that refreshes hair between washes. Adds volume and texture with a fresh berry scent.',
    image: '/products/dry-shampoo.jpg',
    category: 'Hair Care'
  }
]

export const getProductById = (id: string): Product | undefined => {
  return hairProducts.find(product => product.id === id)
}

export const getProductsByCategory = (category: string): Product[] => {
  return hairProducts.filter(product => product.category === category)
}

export const getAllCategories = (): string[] => {
  return [...new Set(hairProducts.map(product => product.category))]
}