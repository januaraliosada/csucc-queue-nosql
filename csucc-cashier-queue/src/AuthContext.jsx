// AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export default function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('/auth')
    setIsAuthenticated(!!stored)
  }, [])

  const login = async (username, password) => {
    setIsLoading(true)
    
    try {
      // Try backend authentication first
      const backendUrl = getBackendUrl()
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.access_token) {
          localStorage.setItem('auth', 'true')
          localStorage.setItem('auth_token', 'authenticated') // Simple token for this implementation
          setIsAuthenticated(true)
          setIsLoading(false)
          return true
        }
      }
      
      // Fallback to environment variables if backend is not available
      const envUsername = import.meta.env.VITE_USERNAME
      const envPassword = import.meta.env.VITE_PASSWORD

      if (username === envUsername && password === envPassword) {
        localStorage.setItem('auth', 'true')
        localStorage.setItem('auth_token', 'authenticated')
        setIsAuthenticated(true)
        setIsLoading(false)
        return true
      }
      
      setIsLoading(false)
      return false
      
    } catch (error) {
      console.error('Authentication error:', error)
      
      // Fallback to environment variables
      const envUsername = import.meta.env.VITE_USERNAME
      const envPassword = import.meta.env.VITE_PASSWORD

      if (username === envUsername && password === envPassword) {
        localStorage.setItem('auth', 'true')
        localStorage.setItem('auth_token', 'authenticated')
        setIsAuthenticated(true)
        setIsLoading(false)
        return true
      }
      
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('auth')
    localStorage.removeItem('auth_token')
    setIsAuthenticated(false)
  }

  const getAuthToken = () => {
    return localStorage.getItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      login, 
      logout, 
      getAuthToken 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Helper function to determine backend URL
function getBackendUrl() {
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000'
  } else {
    return `${protocol}//${hostname}:5000`
  }
}
