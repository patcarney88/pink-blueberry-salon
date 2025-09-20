export interface Product {
  id: string
  name: string
  description: string
  shortDescription: string
  price: number
  originalPrice?: number
  discountPercentage?: number
  category: ProductCategory
  subcategory: string
  brand: string
  images: ProductImage[]
  features: string[]
  ingredients?: string[]
  specifications?: ProductSpecification[]
  reviews: ProductReview[]
  rating: number
  reviewCount: number
  inStock: boolean
  stockQuantity: number
  tags: string[]
  isNew?: boolean
  isBestseller?: boolean
  isOrganic?: boolean
  sizeOptions?: SizeOption[]
  colorOptions?: ColorOption[]
}

export interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  isLifestyle?: boolean
}

export interface ProductSpecification {
  name: string
  value: string
}

export interface ProductReview {
  id: string
  customerName: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
  helpful: number
}

export interface SizeOption {
  id: string
  name: string
  value: string
  price?: number
  inStock: boolean
}

export interface ColorOption {
  id: string
  name: string
  hex: string
  image?: string
  inStock: boolean
}

export type ProductCategory = 'hair-care' | 'organic-soaps' | 'professional-tools' | 'gift-sets'

export interface CartItem {
  product: Product
  quantity: number
  selectedSize?: SizeOption
  selectedColor?: ColorOption
  addedAt: string
}

export interface WishlistItem {
  product: Product
  addedAt: string
}

export interface FilterOptions {
  categories: ProductCategory[]
  priceRange: [number, number]
  brands: string[]
  ratings: number[]
  inStockOnly: boolean
  tags: string[]
}

export interface SortOption {
  value: string
  label: string
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
]

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  'hair-care': 'Hair Care Products',
  'organic-soaps': 'Organic Soaps',
  'professional-tools': 'Professional Tools',
  'gift-sets': 'Gift Sets',
}