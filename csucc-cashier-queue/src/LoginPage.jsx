import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { toast } from 'react-toastify'
import { Wifi, WifiOff } from 'lucide-react'
import websocketQueueStorage from './utils/websocketStorage.js'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let connectionIntervalId; // Declare a variable to hold the interval ID

    const startCheckingConnection = () => {
      // Clear any existing interval before starting a new one
      if (connectionIntervalId) {
        clearInterval(connectionIntervalId);
      }
      connectionIntervalId = setInterval(() => {
        setIsConnected(websocketQueueStorage.isConnectedToServer());
      }, 1000);
    };

    const stopCheckingConnection = () => {
      if (connectionIntervalId) {
        clearInterval(connectionIntervalId);
        connectionIntervalId = null; // Reset the ID
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCheckingConnection();
      } else {
        startCheckingConnection();
      }
    };

    // Initial check and start polling if visible
    if (!document.hidden) {
      startCheckingConnection();
    } else {
      setIsConnected(websocketQueueStorage.isConnectedToServer()); // Get current status even if hidden
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      stopCheckingConnection();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const showToast = (type, message) => {
    toast[type](message, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      progress: undefined,
      theme: "light",
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      showToast('error', 'Please enter both username and password.')
      return
    }
    if(!isConnected){
      showToast('error', 'You are currently offline.')
      return
    }
    const result = await login(username, password)
    if (result.status === 'success') {
      
      showToast('success', result.message || 'Login successful.')
      navigate('/window')
    } else {
      showToast('error', result.message || 'Login failed.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
  
        <div className="flex items-center gap-2 mb-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">Offline</span>
            </>
          )}
        </div>
        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 px-4 py-2 border rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 px-4 py-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Log In
        </button>
      </form>
    </div>
  )
}
