// AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export default function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const login = async (username, password) => {
    setIsLoading(true)
    
    try {
      // Try backend authentication
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
          localStorage.setItem('auth_token', result.access_token)
          localStorage.setItem('user_data', JSON.stringify(result.user))
          setIsAuthenticated(true)
          setUser(result.user)
          setIsLoading(false)
          return true
        }
      } else {
        console.error('Login failed:', response.status, response.statusText)
      }
      
      setIsLoading(false)
      return false
      
    } catch (error) {
      console.error('Authentication error:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setIsAuthenticated(false)
    setUser(null)
  }

  const getAuthToken = () => {
    return localStorage.getItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      user,
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
