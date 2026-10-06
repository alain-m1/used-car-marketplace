// src/services/api.js
import axios from 'axios'
import toast from 'react-hot-toast'

// Same-origin by default: in AWS the ALB routes /api/* to the backend service.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-2'
const COGNITO_CLIENT_ID = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID
const COGNITO_ENDPOINT = `https://cognito-idp.${AWS_REGION}.amazonaws.com/`

export const AUTH_STORAGE_KEYS = ['authToken', 'refreshToken', 'user']

export const clearStoredAuth = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
}

// Minimal Cognito User Pools client (public app client, no secret). It talks to the
// Cognito IDP JSON API directly, so no extra npm dependency is needed.
const cognitoRequest = async (target, payload) => {
  if (!COGNITO_CLIENT_ID) {
    throw new Error('Cognito is not configured (VITE_AWS_COGNITO_CLIENT_ID is missing)')
  }
  let response
  try {
    response = await fetch(COGNITO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (networkError) {
    throw new Error('Network error. Please check your connection.')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.message || 'Authentication failed')
    error.code = (body.__type || '').split('#').pop()
    throw error
  }
  return body
}

export const COGNITO_ERROR_MESSAGES = {
  NotAuthorizedException: 'Incorrect email or password.',
  UserNotFoundException: 'Incorrect email or password.',
  UserNotConfirmedException: 'Please confirm your email address before signing in.',
  UsernameExistsException: 'An account with this email already exists.',
  InvalidPasswordException: 'Password does not meet the requirements.',
  TooManyRequestsException: 'Too many attempts. Please try again later.',
  LimitExceededException: 'Too many attempts. Please try again later.',
}

export const cognitoErrorMessage = (error, fallback) =>
  COGNITO_ERROR_MESSAGES[error.code] || error.message || fallback

// Reads claims for display/profile defaults only. The backend validates the signature.
export const decodeJwtClaims = (token) => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(escape(atob(payload))))
  } catch (e) {
    return {}
  }
}

const toTokens = (result, previousRefreshToken) => ({
  idToken: result.IdToken,
  // The backend only accepts Cognito ACCESS tokens (token_use=access).
  accessToken: result.AccessToken,
  refreshToken: result.RefreshToken || previousRefreshToken,
})

export const cognitoAPI = {
  signUp: ({ email, password, firstName, lastName }) =>
    cognitoRequest('SignUp', {
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
      ],
    }),

  confirmSignUp: ({ email, code }) =>
    cognitoRequest('ConfirmSignUp', {
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    }),

  signIn: async ({ email, password }) => {
    const { AuthenticationResult } = await cognitoRequest('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    })
    if (!AuthenticationResult) {
      throw new Error('Additional sign-in steps are required for this account.')
    }
    return toTokens(AuthenticationResult)
  },

  refresh: async (refreshToken) => {
    const { AuthenticationResult } = await cognitoRequest('InitiateAuth', {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    })
    return toTokens(AuthenticationResult, refreshToken)
  },

  signOut: (accessToken) => cognitoRequest('GlobalSignOut', { AccessToken: accessToken }),
}

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

// Refresh the Cognito access token with the stored refresh token (single flight)
let refreshPromise = null
const refreshAccessToken = () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return Promise.reject(new Error('No refresh token'))
  if (!refreshPromise) {
    refreshPromise = cognitoAPI
      .refresh(refreshToken)
      .then(({ accessToken }) => {
        localStorage.setItem('authToken', accessToken)
        return accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const { response } = error
    const original = error.config

    if (!response) {
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }

    switch (response.status) {
      case 401:
        // Access tokens last 60 minutes: renew once and replay the request
        if (original && !original._retried && localStorage.getItem('refreshToken')) {
          original._retried = true
          try {
            const accessToken = await refreshAccessToken()
            original.headers.Authorization = `Bearer ${accessToken}`
            return api(original)
          } catch (refreshError) {
            // fall through to sign-out below
          }
        }
        clearStoredAuth()
        window.location.href = '/auth/login'
        toast.error('Session expired. Please login again.')
        break
      case 403:
        toast.error('You do not have permission to perform this action.')
        break
      case 404:
        // Callers can opt out (e.g. GET /users/me before the profile exists)
        if (!original?.skipNotFoundToast) toast.error('Resource not found.')
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

// Auth API: Cognito handles credentials; the backend owns the profile row,
// linked to the Cognito `sub` claim of the access token.
export const authAPI = {
  // 404 is expected right after sign-up (no profile row yet), so skip the error toast
  getCurrentUser: () => api.get('/users/me', { skipNotFoundToast: true }),
  syncProfile: (profile) => api.post('/users', profile),
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
  // The backend takes the seller from the signed-in user's token
  createListing: (listingData) => api.post('/listings', listingData),
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

// File upload API: the backend stores each image in S3 and returns its CloudFront URL
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/uploads/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  },
}

export default api
