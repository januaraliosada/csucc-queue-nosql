// Queue Storage Utility - Frontend-only synchronization
// This module handles all queue state management using localStorage and browser events

import SoundNotification from './soundNotification.js'

// Initialize sound notification system
const soundNotification = new SoundNotification()

class QueueStorage {
  constructor() {
    this.storageKey = 'window_queue_state'
    this.listeners = new Set()
    this.broadcastChannel = null
    this.defaultState = {
        queue: [],
        windows: [
          { id: 1, window_name: 'Window 1', status: 'available', current_customer: null },
          { id: 2, window_name: 'Window 2', status: 'available', current_customer: null },
        ],
        nextNumber: 1,
        lastUpdated: Date.now()
      }
    // Initialize BroadcastChannel if supported
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('queue_updates')
      this.broadcastChannel.addEventListener('message', this.handleBroadcastMessage.bind(this))
    }
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', this.handleStorageEvent.bind(this))
    
    // Initialize default state if not exists
    this.initializeState()
    
    // Initialize sound system on first user interaction
    this.initializeSoundOnInteraction()
  }

  /**
   * Initialize sound system after user interaction (required by browsers)
   */
  initializeSoundOnInteraction() {
    const initializeSound = async () => {
      await soundNotification.initialize()
      // Remove event listeners after initialization
      document.removeEventListener('click', initializeSound)
      document.removeEventListener('keydown', initializeSound)
      document.removeEventListener('touchstart', initializeSound)
    }

    // Add event listeners for user interaction
    document.addEventListener('click', initializeSound, { once: true })
    document.addEventListener('keydown', initializeSound, { once: true })
    document.addEventListener('touchstart', initializeSound, { once: true })
  }

  initializeState() {
    const existingState = this.getState()
    if (!existingState) {
      
      this.setState(this.defaultState)
    }
  }

  getState() {
    try {
      const state = localStorage.getItem(this.storageKey)
      return state ? JSON.parse(state) : null
    } catch (error) {
      console.error('Error reading queue state:', error)
      return null
    }
  }

  setState(newState) {
    try {
      const stateWithTimestamp = {
        ...newState,
        lastUpdated: Date.now()
      }
      localStorage.setItem(this.storageKey, JSON.stringify(stateWithTimestamp))
      
      // Broadcast to other tabs using BroadcastChannel
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'state_update',
          state: stateWithTimestamp
        })
      }
      
      // Notify local listeners
      this.notifyListeners(stateWithTimestamp)
    } catch (error) {
      console.error('Error saving queue state:', error)
    }
  }

  handleStorageEvent(event) {
    if (event.key === this.storageKey && event.newValue) {
      try {
        const newState = JSON.parse(event.newValue)
        this.notifyListeners(newState)
      } catch (error) {
        console.error('Error handling storage event:', error)
      }
    }
  }

  handleBroadcastMessage(event) {
    if (event.data.type === 'state_update') {
      this.notifyListeners(event.data.state)
    }
  }

  notifyListeners(state) {
    this.listeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('Error in state listener:', error)
      }
    })
  }

  subscribe(listener) {
    this.listeners.add(listener)
    
    // Immediately call with current state
    const currentState = this.getState()
    if (currentState) {
      listener(currentState)
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Queue management methods
  addCustomer(isPriority = false) {
    const state = this.getState()
    if (!state) return null

    const customerNumber = `C${String(state.nextNumber).padStart(3, '0')}`
    const newCustomer = {
      id: Date.now(),
      queue_number: customerNumber,
      isPriority: isPriority,
      joinedAt:  Date.now(),
      timestamp: new Date().toISOString(),
      status: 'waiting'
    }

    // Insert priority customers at the beginning of the queue, regular customers at the end
    let newQueue
    if (isPriority) {
      // Find the position to insert the priority customer (after other priority customers)
      const lastPriorityIndex = state.queue.findLastIndex(customer => customer.isPriority)
      if (lastPriorityIndex === -1) {
        // No priority customers exist, add at the beginning
        newQueue = [newCustomer, ...state.queue]
      } else {
        // Insert after the last priority customer
        newQueue = [
          ...state.queue.slice(0, lastPriorityIndex + 1),
          newCustomer,
          ...state.queue.slice(lastPriorityIndex + 1)
        ]
      }
    } else {
      // Regular customer goes to the end
      newQueue = [...state.queue, newCustomer]
    }
    const newState = {
      ...state,
      queue: newQueue,
      nextNumber: state.nextNumber + 1
    }

    this.setState(newState)
    return newCustomer
  }

  /**
   * Toggle priority status of a customer
   */
  toggleCustomerPriority(customerId) {
    const state = this.getState();
    if (!state) return false;

    const customerIndex = state.queue.findIndex(c => c.id === customerId);
    if (customerIndex === -1) return false;

    const customer = state.queue[customerIndex];
    const updatedCustomer = { ...customer, isPriority: !customer.isPriority };
    // Remove the toggled customer from the queue
    const queueWithoutCustomer = state.queue.filter(c => c.id !== customerId);

    // Separate into priority and non-priority groups
    let priorityCustomers = queueWithoutCustomer.filter(c => c.isPriority);
    let regularCustomers = queueWithoutCustomer.filter(c => !c.isPriority);

    let newQueue;

    if (updatedCustomer.isPriority) {
      // Priority customers go at the top; newly prioritized goes to the end of that group
      priorityCustomers.push(updatedCustomer);
      newQueue = [...priorityCustomers, ...regularCustomers];
    } else {
      // Regular customers must be sorted by `joinedAt` to restore natural order
      // Insert the updated customer back in the correct spot
      regularCustomers.push(updatedCustomer);
      regularCustomers.sort((a, b) => a.joinedAt - b.joinedAt);

      newQueue = [...priorityCustomers, ...regularCustomers];
    }

    const newState = {
      ...state,
      queue: newQueue
    };

    this.setState(newState);
    return true;
  }

  async callNextCustomer(windowId) {
    const state = this.getState()
    if (!state || state.queue.length === 0) return null

    const nextCustomer = state.queue[0]
    const updatedQueue = state.queue.slice(1)
    
    const updatedWindows = state.windows.map(window => {
      if (window.id === windowId) {
        return {
          ...window,
          status: 'serving',
          current_customer: nextCustomer.queue_number,
          joinedAt: Date.now(),
          timestamp: new Date().toISOString(),
          isPriority: nextCustomer.isPriority,
        }
      }
      return window
    })

    const newState = {
      ...state,
      queue: updatedQueue,
      windows: updatedWindows
    }

    this.setState(newState)
    
    // Play sound notification
    try {
      // await soundNotification.playCallNotification()
      // await soundNotification.speakCustomerNowServing(nextCustomer.queue_number, windowId)
    } catch (error) {
      console.warn('Failed to play sound notification:', error)
    }
    
    return nextCustomer
  }
  async ringNotification(){
    // Play bell sound notification
    try {
      await soundNotification.playCallNotification()
    } catch (error) {
      console.warn('Failed to play bell sound:', error)
    }
  }
  completeService(windowId) {
    const state = this.getState()
    if (!state) return false

    const updatedWindows = state.windows.map(window => {
      if (window.id === windowId) {
        return {
          ...window,
          status: 'available',
          current_customer: null
        }
      }
      return window
    })

    const newState = {
      ...state,
      windows: updatedWindows
    }

    this.setState(newState)
    return true
  }

  resetQueue() {
    const state = this.getState()
    if (!state) return false
    this.setState(this.defaultState)
    return true
  }

  getQueueStatus() {
    return this.getState()
  }

  // Cleanup method
  destroy() {
    window.removeEventListener('storage', this.handleStorageEvent.bind(this))
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
    }
    this.listeners.clear()
  }
}

// Create singleton instance
const queueStorage = new QueueStorage()

export default queueStorage

