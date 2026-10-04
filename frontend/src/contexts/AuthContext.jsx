// src/contexts/AuthContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react'
import {
  authAPI,
  usersAPI,
  cognitoAPI,
  cognitoErrorMessage,
  decodeJwtClaims,
  clearStoredAuth,
} from '../services/api'
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

const persistSession = ({ accessToken, refreshToken }, user) => {
  localStorage.setItem('authToken', accessToken)
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
  localStorage.setItem('user', JSON.stringify(user))
}

// Profile row for a Cognito user that has no database record yet (e.g. a sign-up
// whose sync call failed). Built from the ID token claims.
const profileFromIdToken = (idToken) => {
  const claims = decodeJwtClaims(idToken)
  const email = claims.email || ''
  const base = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9._-]/g, '')
  const suffix = (claims.sub || '').slice(0, 6)
  return {
    username: `${base.padEnd(3, '0')}${suffix ? `_${suffix}` : ''}`.slice(0, 50),
    email,
    firstName: claims.given_name || 'User',
    lastName: claims.family_name || 'User',
    role: 'SHOPPER',
  }
}

// Loads the database profile for the signed-in Cognito user; creates it when missing.
// The backend links the row to the access token's `sub`, so the token is all it needs.
const loadOrCreateProfile = async (tokens, profile) => {
  try {
    const { data } = await authAPI.getCurrentUser()
    return data
  } catch (error) {
    if (error.response?.status !== 404) throw error
  }
  const { data } = await authAPI.syncProfile(profile || profileFromIdToken(tokens.idToken))
  return data
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Restore the session from localStorage. An expired access token is renewed by the
  // axios interceptor on the first API call.
  useEffect(() => {
      const token = localStorage.getItem('authToken')
      const userStr = localStorage.getItem('user')

      if (token && userStr) {
        try {
          dispatch({
            type: 'LOGIN_SUCCESS',
          payload: { user: JSON.parse(userStr), token },
          })
        return
        } catch (error) {
          console.error('Error parsing user data:', error)
        clearStoredAuth()
        }
    }
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [])

  const completeSignIn = async (tokens, profile) => {
    // The axios request interceptor reads the token from localStorage
    localStorage.setItem('authToken', tokens.accessToken)
    const user = await loadOrCreateProfile(tokens, profile)
    persistSession(tokens, user)
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: tokens.accessToken } })
    return user
  }

  const login = async ({ email, password }) => {
    try {
      dispatch({ type: 'LOGIN_START' })
      
      const tokens = await cognitoAPI.signIn({ email, password })
      const user = await completeSignIn(tokens)
      
      toast.success(`Welcome back, ${user.firstName}!`)
      return { user, token: tokens.accessToken }
    } catch (error) {
      clearStoredAuth()
      dispatch({ type: 'LOGIN_ERROR' })
      toast.error(error.response?.data?.message || cognitoErrorMessage(error, 'Login failed'))
      throw error
    }
  }

  const register = async (userData) => {
    const { username, email, password, firstName, lastName, role } = userData
    try {
      dispatch({ type: 'LOGIN_START' })
      
      // Fail early on a taken username: Cognito only knows about emails
      const { data: availability } = await usersAPI.checkUsernameAvailability(username)
      if (availability?.available === false) {
        const conflict = new Error('Username already exists')
        conflict.code = 'UsernameTakenException'
        conflict.message = 'That username is already taken.'
        throw conflict
      }

      const signUp = await cognitoAPI.signUp({ email, password, firstName, lastName })
      if (!signUp.UserConfirmed) {
        const pending = new Error('Please confirm your email address, then sign in.')
        pending.code = 'UserNotConfirmedException'
        throw pending
      }

      // Sign in, then create the profile row via POST /api/v1/users. The backend links it to
      // the token's `sub` and only grants SELLER or SHOPPER from this call.
      const tokens = await cognitoAPI.signIn({ email, password })
      const user = await completeSignIn(tokens, {
        username,
        email,
        firstName,
        lastName,
        role: role === 'SELLER' ? 'SELLER' : 'SHOPPER',
      })
      
      toast.success(`Welcome to Car Marketplace, ${user.firstName}!`)
      return { user, token: tokens.accessToken }
    } catch (error) {
      clearStoredAuth()
      dispatch({ type: 'LOGIN_ERROR' })
      toast.error(error.response?.data?.message || cognitoErrorMessage(error, 'Registration failed'))
      throw error
    }
  }

  const logout = async () => {
    const token = localStorage.getItem('authToken')
    try {
      // Revokes all refresh tokens for this user in Cognito
      if (token) await cognitoAPI.signOut(token)
    } catch (error) {
      // Token already expired or network down: still sign out locally
      console.warn('Cognito sign-out failed:', error.message)
    } finally {
      clearStoredAuth()
      dispatch({ type: 'LOGOUT' })
      toast.success('Logged out successfully')
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
