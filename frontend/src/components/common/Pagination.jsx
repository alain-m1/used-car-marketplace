// src/components/common/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  maxVisiblePages = 5,
  className = ''
}) {
  if (totalPages <= 1) return null

  // Calculate which pages to show
  const getVisiblePages = () => {
    const pages = []
    const start = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2))
    const end = Math.min(totalPages - 1, start + maxVisiblePages - 1)
    
    // Adjust start if we're near the end
    const adjustedStart = Math.max(0, end - maxVisiblePages + 1)
    
    for (let i = adjustedStart; i <= end; i++) {
      pages.push(i)
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()
  const showFirstPage = visiblePages[0] > 0
  const showLastPage = visiblePages[visiblePages.length - 1] < totalPages - 1

  const handlePageClick = (page) => {
    if (page >= 0 && page < totalPages && page !== currentPage) {
      onPageChange(page)
    }
  }

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 0}
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* First Page */}
      {showFirstPage && (
        <>
          <button
            onClick={() => handlePageClick(0)}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            1
          </button>
          {visiblePages[0] > 1 && (
            <span className="flex items-center justify-center w-10 h-10 text-gray-500">
              ...
            </span>
          )}
        </>
      )}

      {/* Visible Pages */}
      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => handlePageClick(page)}
          className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
            page === currentPage
              ? 'border-primary-500 bg-primary-600 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page + 1}
        </button>
      ))}

      {/* Last Page */}
      {showLastPage && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 2 && (
            <span className="flex items-center justify-center w-10 h-10 text-gray-500">
              ...
            </span>
          )}
          <button
            onClick={() => handlePageClick(totalPages - 1)}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
