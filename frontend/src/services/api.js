// src/services/api.js
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error

    if (!response) {
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }

    switch (response.status) {
      case 401:
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        window.location.href = '/auth/login'
        toast.error('Session expired. Please login again.')
        break
      case 403:
        toast.error('You do not have permission to perform this action.')
        break
      case 404:
        toast.error('Resource not found.')
        break
      case 409:
        // Conflict errors (like duplicate username/email) are handled by components
        break
      case 422:
        // Validation errors are handled by forms
        break
      case 500:
        toast.error('Server error. Please try again later.')
        break
      default:
        if (response.data?.message) {
          toast.error(response.data.message)
        } else {
          toast.error('An unexpected error occurred.')
        }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/users', userData),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
}

// Users API
export const usersAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  getUserByUsername: (username) => api.get(`/users/username/${username}`),
  updateProfile: (id, userData) => api.put(`/users/${id}`, userData),
  checkUsernameAvailability: (username) => api.get(`/users/check/username/${username}`),
  checkEmailAvailability: (email) => api.get(`/users/check/email/${email}`),
  
  // Admin only
  getAllUsers: (params) => api.get('/users', { params }),
  getActiveUsers: (params) => api.get('/users/active', { params }),
  getUsersByRole: (role, params) => api.get(`/users/role/${role}`, { params }),
  searchUsers: (query, params) => api.get('/users/search', { params: { q: query, ...params } }),
  activateUser: (id) => api.patch(`/users/${id}/activate`),
  deactivateUser: (id) => api.patch(`/users/${id}/deactivate`),
  getUserStats: () => api.get('/users/stats'),
}

// Listings API
export const listingsAPI = {
  // Public endpoints
  getAllListings: (params) => api.get('/listings', { params }),
  getListingById: (id) => api.get(`/listings/${id}`),
  searchListings: (query, params) => api.get('/listings/search', { params: { q: query, ...params } }),
  filterListings: (filters, params) => api.get('/listings/filter', { params: { ...filters, ...params } }),
  getLatestListings: (params) => api.get('/listings/latest', { params }),
  getMostViewedListings: (params) => api.get('/listings/most-viewed', { params }),
  getAvailableMakes: () => api.get('/listings/makes'),
  getAvailableModels: (make) => api.get(`/listings/models/${make}`),
  
  // Authenticated endpoints
  getListingsBySeller: (sellerId, params) => api.get(`/listings/seller/${sellerId}`, { params }),
  createListing: (listingData, sellerId) => api.post('/listings', listingData, { params: { sellerId } }),
  updateListing: (id, listingData, userId) => api.put(`/listings/${id}`, listingData, { params: { userId } }),
  updateListingStatus: (id, status, userId) => api.patch(`/listings/${id}/status`, null, { params: { status, userId } }),
  deleteListing: (id, userId) => api.delete(`/listings/${id}`, { params: { userId } }),
  
  // Admin only
  getListingStats: () => api.get('/listings/stats'),
}

// Messages API
export const messagesAPI = {
  getMessage: (id) => api.get(`/messages/${id}`),
  getUserMessages: (userId, params) => api.get(`/messages/user/${userId}`, { params }),
  getReceivedMessages: (userId, params) => api.get(`/messages/user/${userId}/received`, { params }),
  getSentMessages: (userId, params) => api.get(`/messages/user/${userId}/sent`, { params }),
  getUnreadMessages: (userId, params) => api.get(`/messages/user/${userId}/unread`, { params }),
  getConversationForListing: (listingId, userId) => api.get(`/messages/listing/${listingId}/user/${userId}`),
  getConversationBetweenUsers: (user1Id, user2Id, listingId) => api.get('/messages/conversation', { 
    params: { user1Id, user2Id, listingId } 
  }),
  sendMessage: (messageData, senderId) => api.post('/messages', messageData, { params: { senderId } }),
  markAsRead: (messageId, userId) => api.patch(`/messages/${messageId}/read`, null, { params: { userId } }),
  markAllAsRead: (userId) => api.patch(`/messages/user/${userId}/read-all`),
  getUnreadCount: (userId) => api.get(`/messages/user/${userId}/unread-count`),
  getMessageCountForListing: (listingId) => api.get(`/messages/listing/${listingId}/count`),
}

// File upload API (for AWS S3)
export const uploadAPI = {
  uploadImage: (file, type = 'listing') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  uploadImages: (files, type = 'listing') => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file)
    })
    formData.append('type', type)
    
    return api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }
}

export default api
