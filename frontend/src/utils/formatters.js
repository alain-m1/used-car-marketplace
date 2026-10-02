// src/utils/formatters.js
import { format, formatDistanceToNow, isValid } from 'date-fns'

/**
 * Format a price value as currency
 * @param {number} price 
 * @returns {string}
 */
export const formatPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return '$0'
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Format a number with commas
 * @param {number} num 
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0'
  }
  
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format a date string or Date object
 * @param {string|Date} date 
 * @param {string} formatStr 
 * @returns {string}
 */
export const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (!isValid(dateObj)) {
    return ''
  }
  
  return format(dateObj, formatStr)
}

/**
 * Format date as relative time (e.g., "2 days ago")
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatRelativeDate = (date) => {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (!isValid(dateObj)) {
    return ''
  }
  
  return formatDistanceToNow(dateObj, { addSuffix: true })
}

/**
 * Format mileage with proper units
 * @param {number} mileage 
 * @returns {string}
 */
export const formatMileage = (mileage) => {
  if (typeof mileage !== 'number' || isNaN(mileage)) {
    return '0 miles'
  }
  
  const formatted = formatNumber(mileage)
  return `${formatted} ${mileage === 1 ? 'mile' : 'miles'}`
}

/**
 * Format file size in bytes to human readable format
 * @param {number} bytes 
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Format phone number
 * @param {string} phoneNumber 
 * @returns {string}
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return ''
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  // Format as +X (XXX) XXX-XXXX for international numbers starting with 1
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  // Return original for other formats
  return phoneNumber
}

/**
 * Truncate text to specified length
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text || ''
  
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Format listing status for display
 * @param {string} status 
 * @returns {object}
 */
export const formatListingStatus = (status) => {
  const statusMap = {
    ACTIVE: {
      label: 'Active',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800'
    },
    SOLD: {
      label: 'Sold',
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800'
    },
    PENDING: {
      label: 'Pending',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    },
    INACTIVE: {
      label: 'Inactive',
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800'
    }
  }
  
  return statusMap[status] || statusMap.ACTIVE
}

/**
 * Format user role for display
 * @param {string} role 
 * @returns {string}
 */
export const formatUserRole = (role) => {
  const roleMap = {
    ADMIN: 'Administrator',
    SELLER: 'Seller',
    SHOPPER: 'Shopper'
  }
  
  return roleMap[role] || role
}

/**
 * Generate initials from full name
 * @param {string} firstName 
 * @param {string} lastName 
 * @returns {string}
 */
export const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  
  return (first + last) || '?'
}

/**
 * Format a validation error message
 * @param {object} error 
 * @returns {string}
 */
export const formatErrorMessage = (error) => {
  if (!error) return ''
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error.message) {
    return error.message
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  return 'An unexpected error occurred'
}

/**
 * Format search query for URL
 * @param {string} query 
 * @returns {string}
 */
export const formatSearchQuery = (query) => {
  if (!query) return ''
  
  return query.trim().replace(/\s+/g, ' ')
}

/**
 * Check if a string is a valid URL
 * @param {string} url 
 * @returns {boolean}
 */
export const isValidUrl = (url) => {
  if (!url) return false
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
