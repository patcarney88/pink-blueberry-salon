'use client'

import { useState } from 'react'
import { Product, FilterOptions, CATEGORY_LABELS } from '@/types/product'
import { ChevronDown, ChevronUp, Star, X } from 'lucide-react'

interface ProductFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  priceRange: [number, number]
  onPriceRangeChange: (range: [number, number]) => void
  products: Product[]
}

export default function ProductFilters({
  filters,
  onFiltersChange,
  priceRange,
  onPriceRangeChange,
  products
}: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    brands: true,
    ratings: true,
    features: true
  })

  // Get unique values from products
  const categories = [...new Set(products.map(p => p.category))]
  const brands = [...new Set(products.map(p => p.brand))].sort()
  const tags = [...new Set(products.flatMap(p => p.tags))].sort()

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category as any)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category as any]
    updateFilter('categories', newCategories)
  }

  const toggleBrand = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand]
    updateFilter('brands', newBrands)
  }

  const toggleRating = (rating: number) => {
    const newRatings = filters.ratings.includes(rating)
      ? filters.ratings.filter(r => r !== rating)
      : [...filters.ratings, rating]
    updateFilter('ratings', newRatings)
  }

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    updateFilter('tags', newTags)
  }

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      priceRange: [0, 500],
      brands: [],
      ratings: [],
      inStockOnly: false,
      tags: []
    })
    onPriceRangeChange([0, 500])
  }

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.ratings.length > 0 ||
    filters.tags.length > 0 ||
    filters.inStockOnly ||
    priceRange[0] > 0 ||
    priceRange[1] < 500

  const FilterSection = ({
    title,
    section,
    children
  }: {
    title: string
    section: keyof typeof openSections
    children: React.ReactNode
  }) => (
    <div className="border-b border-gray-200 pb-6">
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {openSections[section] ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {openSections[section] && (
        <div className="mt-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <FilterSection title="Categories" section="categories">
          {categories.map(category => (
            <label key={category} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.categories.includes(category as any)}
                onChange={() => toggleCategory(category)}
                className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
              </span>
              <span className="ml-auto text-xs text-gray-500">
                ({products.filter(p => p.category === category).length})
              </span>
            </label>
          ))}
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range" section="price">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Min</label>
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => onPriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  min="0"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Max</label>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value) || 500])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  min="0"
                />
              </div>
            </div>

            <div className="relative">
              <input
                type="range"
                min="0"
                max="500"
                value={priceRange[1]}
                onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value)])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>$0</span>
                <span>$500+</span>
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Brands */}
        <FilterSection title="Brands" section="brands">
          {brands.map(brand => (
            <label key={brand} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="ml-3 text-sm text-gray-700">{brand}</span>
              <span className="ml-auto text-xs text-gray-500">
                ({products.filter(p => p.brand === brand).length})
              </span>
            </label>
          ))}
        </FilterSection>

        {/* Ratings */}
        <FilterSection title="Rating" section="ratings">
          {[5, 4, 3, 2, 1].map(rating => (
            <label key={rating} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.ratings.includes(rating)}
                onChange={() => toggleRating(rating)}
                className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <div className="ml-3 flex items-center">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-700">& up</span>
              </div>
              <span className="ml-auto text-xs text-gray-500">
                ({products.filter(p => Math.floor(p.rating) >= rating).length})
              </span>
            </label>
          ))}
        </FilterSection>

        {/* Features/Tags */}
        <FilterSection title="Features" section="features">
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {tags.slice(0, 20).map(tag => (
              <label key={tag} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                <span className="ml-3 text-sm text-gray-700 capitalize">
                  {tag.replace('-', ' ')}
                </span>
                <span className="ml-auto text-xs text-gray-500">
                  ({products.filter(p => p.tags.includes(tag)).length})
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Stock Status */}
        <div className="pt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => updateFilter('inStockOnly', e.target.checked)}
              className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
            <span className="ml-3 text-sm text-gray-700">In stock only</span>
            <span className="ml-auto text-xs text-gray-500">
              ({products.filter(p => p.inStock).length})
            </span>
          </label>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #ec4899, #3b82f6);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #ec4899, #3b82f6);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}