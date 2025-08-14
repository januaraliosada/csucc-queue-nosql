// WebSocket Queue Storage Utility - Real-time multi-device synchronization
// This module handles all queue state management using WebSocket connection to backend

import { io } from 'socket.io-client'
import { toast } from  'react-toastify'




class WebSocketQueueStorage {
  constructor() {
    this.listeners = new Set()
    this.socket = null
    this.isConnected = false
    this.currentState = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = Infinity // Allow infinite reconnection attempts
    this.reconnectDelay = 1000 // Start with 1 second
    this.maxReconnectDelay = 30000 // Maximum 30 seconds between attempts
    this.reconnectTimer = null
    this.connectionCheckInterval = null
    
    // Default state structure
    this.defaultState = {
      queue: [],
      windows: [
        { id: 1, window_name: 'Window 1', status: 'available', current_customer: null },
        { id: 2, window_name: 'Window 2', status: 'available', current_customer: null },
      ],
      nextNumber: 1,
      lastUpdated: Date.now()
    }
    
    // Initialize WebSocket connection
    this.initializeConnection()
    
    // Start periodic connection check
    this.startConnectionCheck()
    
    // Initialize sound system on first user interaction

  }

  /**
   * Start periodic connection check
   */
  startConnectionCheck() {
    // Check connection every 5 seconds
    this.connectionCheckInterval = setInterval(() => {
      if (!this.isConnected && !this.reconnectTimer) {
        console.log('Connection lost, attempting to reconnect...')
        this.attemptReconnection()
      }
    }, 5000)
  }

  /**
   * Stop periodic connection check
   */
  stopConnectionCheck() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval)
      this.connectionCheckInterval = null
    }
  }

  /**
   * Attempt to reconnect to the server
   */
  attemptReconnection() {
    if (this.reconnectTimer) {
      return // Already attempting to reconnect
    }

    this.reconnectAttempts++
    
    // Calculate delay with exponential backoff, capped at maxReconnectDelay
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay)
    
    console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts}) in ${delay}ms`)
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      
      if (this.socket) {
        this.socket.disconnect()
      }
      
      // Re-initialize connection
      this.initializeConnection()
    }, delay)
  }

  /**
   * Initialize WebSocket connection to backend
   */
  initializeConnection() {
    try {
      // Determine backend URL based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.hostname
      const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80')
      
      const socketUrl = import.meta.env.VITE_WEBSOCKET_URL || `http://localhost:5000`
      
      console.log('Connecting to WebSocket server:', socketUrl)
      
      this.socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        autoConnect: false, // Prevent auto-connection
        auth: (cb) => {
          const token = localStorage.getItem("access_token"); // Retrieve token from localStorage
          cb({ token });
        },
      });

      // Manually connect
      this.socket.connect();
      this.setupEventHandlers();
      
    } catch (error) {
      console.error("Failed to initialize WebSocket connection:", error)
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  setupEventHandlers() {
    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server")
      this.isConnected = true
      this.reconnectAttempts = 0
      this.reconnectDelay = 1000
      
      // Clear any pending reconnection timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      
      // Join the queue room for updates
      this.socket.emit("join_queue_room")
    })

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server:", reason)
      this.isConnected = false
      
      // Always attempt to reconnect regardless of disconnect reason
      if (!this.reconnectTimer) {
        setTimeout(() => {
          this.attemptReconnection()
        }, 1000) // Wait 1 second before starting reconnection attempts
      }
    })

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error)
      this.isConnected = false
      
      // Attempt reconnection on connection error
      if (!this.reconnectTimer) {
        setTimeout(() => {
          this.attemptReconnection()
        }, 1000)
      }
    })

    this.socket.on("queue_state_update", (state) => {
      console.log("Received queue state update:", state)
      this.currentState = state
      this.notifyListeners(state)
    })

    this.socket.on("play_ring_notification", async () => {
      try {
        if (window.soundNotification) {
          await window.soundNotification.playCallNotification()
        } else {
          console.warn("Sound notification not initialized yet")
        }
      } catch (error) {
        console.warn("Failed to play ring notification:", error)
      }
    })

    this.socket.on("error", (error) => {
      console.error("WebSocket error:", error)
    })

    // Handle specific operation responses
    this.socket.on("customer_added", (response) => {
      if (response.success) {
        console.log("Customer added successfully:", response.customer)
      }
    })

    this.socket.on("customer_called", (response) => {
      if (response.success) {
        console.log("Customer called successfully:", response.customer)
        // Play sound notification for called customer
        this.playCallNotification()
      }
    })

    this.socket.on("service_completed", (response) => {
      if (response.success) {
        console.log("Service completed successfully for window:", response.windowId)
      }
    })

    this.socket.on("queue_reset", (response) => {
      if (response.success) {
        console.log("Queue reset successfully")
        this.showToast('success', response.message || "Queue has been reset")
      } else {
        console.error("Queue reset failed:", response.message)
        this.showToast('error', response.message || "Failed to reset queue")
      }
    })
  }
  showToast = (type, message) => {
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
  /**
   * Handle connection errors and fallback to localStorage
   */
  handleConnectionError() {
    console.warn("WebSocket connection failed, falling back to localStorage");
    
    // Import and use the original localStorage-based storage as fallback
    import("./queueStorage.js").then(module => {
      const localStorageQueue = module.default;
      this.currentState = localStorageQueue.getState() || this.defaultState;
      this.notifyListeners(this.currentState);
    }).catch(error => {
      console.error("Failed to load localStorage fallback:", error);
      this.currentState = this.defaultState;
      this.notifyListeners(this.currentState);
    });
  }



  /**
   * Play call notification sound
   */
  async playCallNotification() {
    try {
      if (window.soundNotification) {
        await window.soundNotification.playCallNotification()
      } else {
        console.warn("Sound notification not initialized yet")
      }
    } catch (error) {
      console.warn('Failed to play call notification:', error)
    }
  }

  /**
   * Get current queue state
   */
  getState() {
    return this.currentState || this.defaultState
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    this.listeners.add(listener)
    
    // Immediately call with current state
    if (this.currentState) {
      listener(this.currentState)
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of state changes
   */
  notifyListeners(state) {
    this.listeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('Error in state listener:', error)
      }
    })
  }

  // Queue management methods that emit WebSocket events

  /**
   * Add a new customer to the queue
   */
  addCustomer(isPriority = false) {
    if (!this.isConnected) {
      console.warn('Not connected to server, cannot add customer')
      return null
    }

    this.socket.emit('add_customer', { isPriority })
    
    // Return a placeholder customer object (actual customer will come via state update)
    return {
      id: Date.now(),
      queue_number: 'Pending...',
      isPriority,
      status: 'waiting'
    }
  }

  /**
   * Call the next customer
   */
  async callNextCustomer(windowId) {
    if (!this.isConnected) {
      console.warn('Not connected to server, cannot call next customer')
      return null
    }

    this.socket.emit('call_next_customer', { windowId })
    return true
  }

  /**
   * Complete service for a customer
   */
  completeService(windowId) {
    if (!this.isConnected) {
      console.warn('Not connected to server, cannot complete service')
      return false
    }

    this.socket.emit('complete_service', { windowId })
    return true
  }

  /**
   * Toggle customer priority status
   */
  toggleCustomerPriority(customerId) {
    if (!this.isConnected) {
      console.warn('Not connected to server, cannot toggle customer priority')
      return false
    }

    // Ensure customerId is a string for MongoDB ObjectId compatibility
    const customerIdString = typeof customerId === 'string' ? customerId : customerId.toString()
    this.socket.emit('toggle_customer_priority', { customerId: customerIdString })
    return true
  }

  /**
   * Reset the queue
   */
  resetQueue(password) {
    if (!this.isConnected) {
      console.warn('Not connected to server, cannot reset queue')
      return false
    }

    this.socket.emit('reset_queue', { password })
    return true
  }

  /**
   * Send ring notification
   */
  async ringNotification() {
    if (!this.isConnected) {
      console.warn('Not connected to server, cannot send ring notification')
      return
    }

    this.socket.emit('ring_notification')
  }

  /**
   * Get queue status (alias for getState)
   */
  getQueueStatus() {
    return this.getState()
  }

  /**
   * Check if connected to WebSocket server
   */
  isConnectedToServer() {
    return this.isConnected
  }

  /**
   * Cleanup method
   */
  destroy() {
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.stopConnectionCheck()
    
    if (this.socket) {
      this.socket.emit('leave_queue_room')
      this.socket.disconnect()
    }
    this.listeners.clear()
  }
}

// Create singleton instance
const websocketQueueStorage = new WebSocketQueueStorage()

export default websocketQueueStorage