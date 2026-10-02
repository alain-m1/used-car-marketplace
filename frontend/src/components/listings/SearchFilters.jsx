// src/components/listings/SearchFilters.jsx
import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { X } from 'lucide-react'
import { listingsAPI } from '../../services/api'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i)

export default function SearchFilters({ filters, onFiltersChange, onClearAll }) {
  const [localFilters, setLocalFilters] = useState(filters)

  // Fetch available makes
  const { data: makesData } = useQuery(
    'availableMakes',
    listingsAPI.getAvailableMakes,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  // Fetch available models for selected make
  const { data: modelsData } = useQuery(
    ['availableModels', localFilters.make],
    () => listingsAPI.getAvailableModels(localFilters.make),
    {
      enabled: !!localFilters.make,
      staleTime: 10 * 60 * 1000,
    }
  )

  const makes = makesData?.data || []
  const models = modelsData?.data || []

  // Sync local filters with prop filters
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    
    // Clear model if make changes
    if (key === 'make' && value !== localFilters.make) {
      newFilters.model = ''
    }
    
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleClearAll = () => {
    const clearedFilters = Object.keys(localFilters).reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {})
    
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    onClearAll()
  }

  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Min Price</label>
            <select
              value={localFilters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="input text-sm"
            >
              <option value="">No minimum</option>
              <option value="1000">$1,000</option>
              <option value="2500">$2,500</option>
              <option value="5000">$5,000</option>
              <option value="7500">$7,500</option>
              <option value="10000">$10,000</option>
              <option value="15000">$15,000</option>
              <option value="20000">$20,000</option>
              <option value="25000">$25,000</option>
              <option value="30000">$30,000</option>
              <option value="40000">$40,000</option>
              <option value="50000">$50,000</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max Price</label>
            <select
              value={localFilters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="input text-sm"
            >
              <option value="">No maximum</option>
              <option value="2500">$2,500</option>
              <option value="5000">$5,000</option>
              <option value="7500">$7,500</option>
              <option value="10000">$10,000</option>
              <option value="15000">$15,000</option>
              <option value="20000">$20,000</option>
              <option value="25000">$25,000</option>
              <option value="30000">$30,000</option>
              <option value="40000">$40,000</option>
              <option value="50000">$50,000</option>
              <option value="75000">$75,000</option>
              <option value="100000">$100,000+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Year Range */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Year</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">From Year</label>
            <select
              value={localFilters.minYear}
              onChange={(e) => handleFilterChange('minYear', e.target.value)}
              className="input text-sm"
            >
              <option value="">Any year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To Year</label>
            <select
              value={localFilters.maxYear}
              onChange={(e) => handleFilterChange('maxYear', e.target.value)}
              className="input text-sm"
            >
              <option value="">Any year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Make and Model */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Make & Model</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Make</label>
            <select
              value={localFilters.make}
              onChange={(e) => handleFilterChange('make', e.target.value)}
              className="input text-sm"
            >
              <option value="">All makes</option>
              {makes.map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Model</label>
            <select
              value={localFilters.model}
              onChange={(e) => handleFilterChange('model', e.target.value)}
              className="input text-sm"
              disabled={!localFilters.make}
            >
              <option value="">All models</option>
              {models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mileage Range */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Mileage</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Min Mileage</label>
            <select
              value={localFilters.minMileage}
              onChange={(e) => handleFilterChange('minMileage', e.target.value)}
              className="input text-sm"
            >
              <option value="">No minimum</option>
              <option value="0">0 miles</option>
              <option value="10000">10,000 miles</option>
              <option value="25000">25,000 miles</option>
              <option value="50000">50,000 miles</option>
              <option value="75000">75,000 miles</option>
              <option value="100000">100,000 miles</option>
              <option value="150000">150,000 miles</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max Mileage</label>
            <select
              value={localFilters.maxMileage}
              onChange={(e) => handleFilterChange('maxMileage', e.target.value)}
              className="input text-sm"
            >
              <option value="">No maximum</option>
              <option value="25000">25,000 miles</option>
              <option value="50000">50,000 miles</option>
              <option value="75000">75,000 miles</option>
              <option value="100000">100,000 miles</option>
              <option value="150000">150,000 miles</option>
              <option value="200000">200,000 miles</option>
              <option value="300000">300,000+ miles</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clear All Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleClearAll}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Clear all filters</span>
        </button>
      </div>
    </div>
  )
}
