// src/contexts/AuthContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('authToken')
      const userStr = localStorage.getItem('user')

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token }
          })
        } catch (error) {
          console.error('Error parsing user data:', error)
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initializeAuth()
  }, [])

  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' })
      
      // For demo purposes, we'll simulate a login response
      // In a real app, this would call authAPI.login(credentials)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock successful login response
      const mockUser = {
        id: 1,
        username: credentials.username,
        email: credentials.email || `${credentials.username}@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        role: credentials.username === 'admin' ? 'ADMIN' : 
              credentials.username.includes('seller') ? 'SELLER' : 'SHOPPER',
        isActive: true,
        location: 'New York, NY',
        phoneNumber: '+1234567890',
      }
      
      const mockToken = 'mock-jwt-token-' + Date.now()
      
      // Store in localStorage
      localStorage.setItem('authToken', mockToken)
      localStorage.setItem('user', JSON.stringify(mockUser))
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: mockUser, token: mockToken }
      })
      
      toast.success(`Welcome back, ${mockUser.firstName}!`)
      return { user: mockUser, token: mockToken }
      
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR' })
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      dispatch({ type: 'LOGIN_START' })
      
      // For demo purposes, simulate registration
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newUser = {
        id: Date.now(),
        ...userData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      const mockToken = 'mock-jwt-token-' + Date.now()
      
      // Store in localStorage
      localStorage.setItem('authToken', mockToken)
      localStorage.setItem('user', JSON.stringify(newUser))
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: newUser, token: mockToken }
      })
      
      toast.success(`Welcome to Car Marketplace, ${newUser.firstName}!`)
      return { user: newUser, token: mockToken }
      
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR' })
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      throw error
    }
  }

  const logout = async () => {
    try {
      // In a real app, you might call authAPI.logout()
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      dispatch({ type: 'LOGOUT' })
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if API call fails
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      dispatch({ type: 'LOGOUT' })
    }
  }

  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    dispatch({ type: 'UPDATE_USER', payload: userData })
  }

  const hasRole = (roles) => {
    if (!state.user) return false
    if (typeof roles === 'string') roles = [roles]
    return roles.includes(state.user.role)
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
