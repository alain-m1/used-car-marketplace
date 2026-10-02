// src/pages/ListingsPage.jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  ChevronDown,
  X,
  MapPin,
  SlidersHorizontal
} from 'lucide-react'
import { listingsAPI } from '../services/api'
import CarCard from '../components/listings/CarCard'
import SearchFilters from '../components/listings/SearchFilters'
import Pagination from '../components/common/Pagination'
import LoadingSpinner from '../components/common/LoadingSpinner'

const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Newest First' },
  { value: 'createdAt,asc', label: 'Oldest First' },
  { value: 'price,asc', label: 'Price: Low to High' },
  { value: 'price,desc', label: 'Price: High to Low' },
  { value: 'mileage,asc', label: 'Mileage: Low to High' },
  { value: 'mileage,desc', label: 'Mileage: High to Low' },
  { value: 'viewCount,desc', label: 'Most Popular' },
]

export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minYear: searchParams.get('minYear') || '',
    maxYear: searchParams.get('maxYear') || '',
    minMileage: searchParams.get('minMileage') || '',
    maxMileage: searchParams.get('maxMileage') || '',
    make: searchParams.get('make') || '',
    model: searchParams.get('model') || '',
  })
  
  const page = parseInt(searchParams.get('page') || '0')
  const size = parseInt(searchParams.get('size') || '12')
  const sort = searchParams.get('sort') || 'createdAt,desc'

  // Fetch listings
  const { 
    data: listingsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['listings', { ...filters, page, size, sort }],
    () => {
      const hasSearch = filters.q.trim()
      const hasFilters = Object.entries(filters).some(([key, value]) => 
        key !== 'q' && value.trim()
      )

      if (hasSearch && !hasFilters) {
        return listingsAPI.searchListings(filters.q, { page, size, sort })
      } else if (hasFilters) {
        const filterParams = Object.entries(filters)
          .filter(([_, value]) => value.trim())
          .reduce((acc, [key, value]) => {
            acc[key] = key === 'q' ? value : value
            return acc
          }, {})
        return listingsAPI.filterListings(filterParams, { page, size, sort })
      } else {
        return listingsAPI.getAllListings({ page, size, sort })
      }
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      keepPreviousData: true,
    }
  )

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(key, value)
      }
    })
    
    if (page > 0) params.set('page', page.toString())
    if (size !== 12) params.set('size', size.toString())
    if (sort !== 'createdAt,desc') params.set('sort', sort)
    
    setSearchParams(params)
  }, [filters, page, size, sort, setSearchParams])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    // Reset to first page when filters change
    if (page > 0) {
      const params = new URLSearchParams(searchParams)
      params.delete('page')
      setSearchParams(params)
    }
  }

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', newSort)
    setSearchParams(params)
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    if (newPage > 0) {
      params.set('page', newPage.toString())
    } else {
      params.delete('page')
    }
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearAllFilters = () => {
    setFilters({
      q: '',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: '',
      minMileage: '',
      maxMileage: '',
      make: '',
      model: '',
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value.trim())

  const listings = listingsData?.data?.content || []
  const totalElements = listingsData?.data?.totalElements || 0
  const totalPages = listingsData?.data?.totalPages || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Used Cars
          </h1>
          <p className="text-gray-600">
            {totalElements > 0 ? (
              <>Showing {totalElements.toLocaleString()} cars</>
            ) : (
              'Find your perfect used car'
            )}
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by make, model, or keyword..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                className="w-full pl-10 pr-4 py-2 input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    refetch()
                  }
                }}
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center space-x-2`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-red-500 text-white text-xs rounded-full h-2 w-2"></span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <SearchFilters
                filters={filters}
                onFiltersChange={handleFilterChange}
                onClearAll={clearAllFilters}
              />
            </motion.div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          {/* Results Info */}
          <div className="flex items-center space-x-4">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
                <span>Clear filters</span>
              </button>
            )}
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center space-x-4">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="input pr-8 text-sm"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load listings</p>
            <button onClick={refetch} className="btn btn-primary">
              Try Again
            </button>
          </div>
        )}

        {/* No Results */}
        {!isLoading && listings.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No cars found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or browse all available cars.
              </p>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="btn btn-primary">
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && listings.length > 0 && (
          <>
            <div className={`grid gap-6 mb-8 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}>
              {listings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <CarCard 
                    listing={listing} 
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
