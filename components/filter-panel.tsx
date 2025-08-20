"use client"

import { X, ChevronDown, ChevronUp } from "lucide-react"
import { useState, useEffect } from "react"
import { useBrands, useCategories } from "@/hooks/use-api"

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  className?: string
  selectedBrands?: string[]
  selectedCategories?: string[]
  onBrandChange?: (brandIds: string[]) => void
  onCategoryChange?: (categoryIds: string[]) => void
  onPriceChange?: (priceRange: [number, number]) => void
  priceRange?: [number, number]
}

export default function FilterPanel({ 
  isOpen, 
  onClose, 
  className = "",
  selectedBrands = [],
  selectedCategories = [],
  onBrandChange,
  onCategoryChange,
  onPriceChange,
  priceRange = [0, 1000]
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
    brand: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Fetch categories and brands from API
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const { data: brands = [], isLoading: brandsLoading } = useBrands()

  const handleBrandToggle = (brandId: string) => {
    if (!onBrandChange) return
    
    const newSelectedBrands = selectedBrands.includes(brandId)
      ? selectedBrands.filter(id => id !== brandId)
      : [...selectedBrands, brandId]
    
    onBrandChange(newSelectedBrands)
  }

  const handleCategoryToggle = (categoryId: string) => {
    if (!onCategoryChange) return
    
    const newSelectedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId]
    
    onCategoryChange(newSelectedCategories)
  }

  return (
    <aside
      className={`bg-surface-primary border-r border-border-secondary w-64 p-4 ${className} ${isOpen ? "block" : "hidden lg:block"} z-50`}
    >
      <div className="flex items-center justify-between mb-6 lg:hidden">
        <h2 className="text-lg font-semibold text-text-primary">Filters</h2>
        <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-lg" aria-label="Close filters">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <button
            onClick={() => toggleSection("category")}
            className="flex items-center justify-between w-full text-text-primary font-semibold mb-3"
          >
            Category
            {expandedSections.category ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expandedSections.category && (
            <div className="space-y-2">
              {categoriesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="ml-2 h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                categories.map((category) => (
                  <label key={category._id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-border-primary text-brand-accent focus:ring-brand-accent"
                      checked={selectedCategories.includes(category._id)}
                      onChange={() => handleCategoryToggle(category._id)}
                    />
                    <span className="ml-2 text-text-secondary">{category.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Price Filter */}
        <div className="border-t border-border-primary pt-6">
          <button
            onClick={() => toggleSection("price")}
            className="flex items-center justify-between w-full text-text-primary font-semibold mb-3"
          >
            Price Range
            {expandedSections.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expandedSections.price && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-border-primary rounded text-sm"
                />
                <span className="text-text-secondary">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-border-primary rounded text-sm"
                />
              </div>
              <div className="space-y-2">
                {["Under $5", "$5 - $10", "$10 - $20", "Over $20"].map((range) => (
                  <label key={range} className="flex items-center">
                    <input type="radio" name="priceRange" className="text-brand-accent focus:ring-brand-accent" />
                    <span className="ml-2 text-text-secondary">{range}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div className="border-t border-border-primary pt-6">
          <button
            onClick={() => toggleSection("rating")}
            className="flex items-center justify-between w-full text-text-primary font-semibold mb-3"
          >
            Rating
            {expandedSections.rating ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expandedSections.rating && (
            <div className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <label key={rating} className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-border-primary text-brand-accent focus:ring-brand-accent"
                  />
                  <span className="ml-2 text-text-secondary">{rating}+ Stars</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Brand Filter */}
        <div className="border-t border-border-primary pt-6">
          <button
            onClick={() => toggleSection("brand")}
            className="flex items-center justify-between w-full text-text-primary font-semibold mb-3"
          >
            Brand
            {expandedSections.brand ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {expandedSections.brand && (
            <div className="space-y-2">
              {brandsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="ml-2 h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                brands.map((brand) => (
                  <label key={brand._id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-border-primary text-brand-accent focus:ring-brand-accent"
                      checked={selectedBrands.includes(brand._id)}
                      onChange={() => handleBrandToggle(brand._id)}
                    />
                    <span className="ml-2 text-text-secondary">{brand.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Clear Filters */}
        <button 
          className="w-full bg-surface-tertiary text-text-primary py-2 rounded-lg hover:bg-surface-hover transition"
          onClick={() => {
            onBrandChange?.([])
            onCategoryChange?.([])
            onPriceChange?.([0, 1000])
          }}
        >
          Clear All Filters
        </button>
      </div>
    </aside>
  )
}
