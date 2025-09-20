'use client'

import { useState, useMemo } from 'react'
import { Product, FilterOptions, SortOption, SORT_OPTIONS, CATEGORY_LABELS } from '@/types/product'
import { mockProducts, searchProducts } from '@/data/products'
import ProductCard from './ProductCard'
import ProductFilters from './ProductFilters'
import QuickViewModal from './QuickViewModal'
import { Search, SlidersHorizontal, Grid3X3, Grid2X2 } from 'lucide-react'

interface ProductGridProps {
  initialProducts?: Product[]
  showFilters?: boolean
  title?: string
  subtitle?: string
}

export default function ProductGrid({
  initialProducts = mockProducts,
  showFilters = true,
  title = "Our Products",
  subtitle = "Discover our curated collection of luxury salon products"
}: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('featured')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [gridCols, setGridCols] = useState<'2' | '3'>('3')
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    priceRange: [0, 500],
    brands: [],
    ratings: [],
    inStockOnly: false,
    tags: []
  })

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = initialProducts

    // Search filter
    if (searchQuery.trim()) {
      filtered = searchProducts(searchQuery).filter(product =>
        initialProducts.some(p => p.id === product.id)
      )
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Price range filter
    filtered = filtered.filter(
      product => product.price >= priceRange[0] && product.price <= priceRange[1]
    )

    // Additional filters
    if (filters.brands.length > 0) {
      filtered = filtered.filter(product => filters.brands.includes(product.brand))
    }

    if (filters.inStockOnly) {
      filtered = filtered.filter(product => product.inStock)
    }

    if (filters.ratings.length > 0) {
      filtered = filtered.filter(product =>
        filters.ratings.some(rating => Math.floor(product.rating) >= rating)
      )
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(product =>
        filters.tags.some(tag => product.tags.includes(tag))
      )
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        return [...filtered].sort((a, b) => a.price - b.price)
      case 'price-high':
        return [...filtered].sort((a, b) => b.price - a.price)
      case 'name-asc':
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
      case 'name-desc':
        return [...filtered].sort((a, b) => b.name.localeCompare(a.name))
      case 'rating':
        return [...filtered].sort((a, b) => b.rating - a.rating)
      case 'newest':
        return [...filtered].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
      default:
        // Featured: bestsellers first, then new products, then by rating
        return [...filtered].sort((a, b) => {
          if (a.isBestseller && !b.isBestseller) return -1
          if (!a.isBestseller && b.isBestseller) return 1
          if (a.isNew && !b.isNew) return -1
          if (!a.isNew && b.isNew) return 1
          return b.rating - a.rating
        })
    }
  }, [initialProducts, searchQuery, selectedCategory, priceRange, filters, sortBy])

  const categories = useMemo(() => {
    const cats = [...new Set(initialProducts.map(p => p.category))]
    return cats.map(cat => ({ value: cat, label: CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat }))
  }, [initialProducts])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">{title}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Search and Controls */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="">All Categories</option>
              {categories.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showFilters && (
                <button
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    showFiltersPanel
                      ? 'bg-pink-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                </button>
              )}

              <div className="text-sm text-gray-600">
                {filteredAndSortedProducts.length} products found
              </div>
            </div>

            {/* Grid Layout Toggle */}
            <div className="hidden md:flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setGridCols('2')}
                className={`p-2 rounded transition-colors ${
                  gridCols === '2' ? 'bg-pink-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridCols('3')}
                className={`p-2 rounded transition-colors ${
                  gridCols === '3' ? 'bg-pink-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && showFiltersPanel && (
            <div className="w-80 flex-shrink-0">
              <ProductFilters
                filters={filters}
                onFiltersChange={setFilters}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                products={initialProducts}
              />
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('')
                    setFilters({
                      categories: [],
                      priceRange: [0, 500],
                      brands: [],
                      ratings: [],
                      inStockOnly: false,
                      tags: []
                    })
                    setPriceRange([0, 500])
                  }}
                  className="bg-gradient-to-r from-pink-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                gridCols === '2'
                  ? 'grid-cols-1 lg:grid-cols-2'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={setQuickViewProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  )
}