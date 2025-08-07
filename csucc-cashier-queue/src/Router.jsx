import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Monitor, Users } from 'lucide-react'
import App from './App.jsx'
import PublicDisplay from './PublicDisplay.jsx'
import LoginPage from './LoginPage.jsx'
import { useAuth } from './AuthContext.jsx'
import { ToastContainer } from 'react-toastify'
import './App.css'

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Cashier Queue Management System
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Choose your interface to get started
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Window Interface */}
          <Link to="/window">
            <div className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-blue-300">
              <div className="text-blue-600 mb-4">
                <Users className="h-16 w-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Cashier Interface
              </h2>
              <p className="text-gray-600 mb-6">
                Manage the queue, call customers, and handle service operations
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg">
                Access Window Panel
              </Button>
            </div>
          </Link>

          {/* Public Display */}
          <Link to="/display">
            <div className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-green-300">
              <div className="text-green-600 mb-4">
                <Monitor className="h-16 w-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Public Display
              </h2>
              <p className="text-gray-600 mb-6">
                View current queue status, serving numbers, and wait times
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg">
                View Public Display
              </Button>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>For full-screen public display, use the Public Display interface on a dedicated monitor</p>
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <LoginPage />
  }
  
  return children
}

function AppRouter() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/display" element={<PublicDisplay />} />
          <Route
            path="/window"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="light"
        />
    </>
  )
}


export default AppRouter

