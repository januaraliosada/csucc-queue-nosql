import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Clock, Users, Monitor, Star, Wifi, WifiOff } from 'lucide-react'
import websocketQueueStorage from './utils/websocketStorage.js'
import RotatingText from './utils/rotatingText.jsx'
import './utils/css/rotatingText.css'
import SoundNotification from './utils/soundNotification.js'

function PublicDisplay() {
  const [queueState, setQueueState] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isConnected, setIsConnected] = useState(false)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const soundNotifierRef = useRef(null)

  const lastServedMap = useRef({})

  // Initialize audio on first user interaction
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Create global AudioContext if it doesn't exist
        if (!window.audioContext) {
          window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Resume AudioContext if suspended
        if (window.audioContext.state === 'suspended') {
          await window.audioContext.resume();
        }
        
        // Create SoundNotification instance with the global AudioContext
        if (!soundNotifierRef.current) {
          soundNotifierRef.current = new SoundNotification();
          soundNotifierRef.current.audioContext = window.audioContext;
          
          // Also set it globally for websocketStorage to use
          window.soundNotification = soundNotifierRef.current;
        }
        
        setAudioInitialized(true);
        console.log('AudioContext and SoundNotification initialized in PublicDisplay');
        
        // Remove event listeners after initialization
        document.removeEventListener('click', initializeAudio);
        document.removeEventListener('keydown', initializeAudio);
        document.removeEventListener('touchstart', initializeAudio);
      } catch (error) {
        console.error('Failed to initialize AudioContext:', error);
      }
    };

    if (!audioInitialized) {
      document.addEventListener('click', initializeAudio, { once: true });
      document.addEventListener('keydown', initializeAudio, { once: true });
      document.addEventListener('touchstart', initializeAudio, { once: true });
    }

    return () => {
      document.removeEventListener('click', initializeAudio);
      document.removeEventListener('keydown', initializeAudio);
      document.removeEventListener('touchstart', initializeAudio);
    };
  }, [audioInitialized]);

  // Subscribe to queue state changes
  useEffect(() => {
    const unsubscribe = websocketQueueStorage.subscribe((newState) => {
      setQueueState(newState)
    })

    // Check connection status periodically
    const checkConnection = () => {
      setIsConnected(websocketQueueStorage.isConnectedToServer())
    }
    
    checkConnection()
    const connectionInterval = setInterval(checkConnection, 1000)

    return () => {
      unsubscribe()
      clearInterval(connectionInterval)
    }
  }, [])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Play sound when a new customer is being served
  useEffect(() => {
    if (!queueState || !queueState.windows || !audioInitialized || !soundNotifierRef.current) return

    const activeWindows = queueState.windows.filter(w => w.current_customer)

    activeWindows.forEach(async (window) => {
      const lastCustomer = lastServedMap.current[window.id]
      const newCustomer = window.current_customer

      if (newCustomer && newCustomer !== lastCustomer) {
        lastServedMap.current[window.id] = newCustomer
        try {
          await soundNotifierRef.current.playCallNotification()
          await soundNotifierRef.current.speakCustomerNowServing(newCustomer, window.id)
        } catch (error) {
          console.error('Failed to play sound notification:', error)
        }
      }
    })
  }, [queueState, audioInitialized])

  if (!queueState) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const { queue, windows } = queueState
  const servingWindows = windows.filter(w => w.current_customer)
  const totalWaiting = queue.length
  const avgWaitTime = totalWaiting > 0 ? Math.max(1, Math.floor(totalWaiting * 2.5)) : 0
  const windowsServing = servingWindows.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Cashier Queue Status</h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-xl text-gray-600">
              {currentTime.toLocaleTimeString('en-US', { 
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-600">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Currently Serving Section */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-bold text-blue-600 flex items-center justify-center gap-3">
              <Monitor className="w-8 h-8" />
              Now Serving
            </CardTitle>
          </CardHeader>
          <CardContent>
            {servingWindows.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 ">
                {servingWindows.map((window) => (
                  <div key={window.id} className="text-center p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="text-6xl font-bold text-blue-600 mb-2">
                      <RotatingText
                        texts={[window.current_customer, window.current_customer]}
                        mainClassName="justify-center rounded-lg"
                        staggerFrom={"last"}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-120%" }}
                        staggerDuration={0.025}
                        splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        rotationInterval={3000}
                      />
                    </div>
                    <p className="text-lg text-gray-700 font-medium">
                      {window.isPriority && (
                        <Badge className="bg-orange-100 text-orange-800 text-sm">
                          <Star className="h-3 w-3 mr-1" />
                          Priority
                        </Badge>
                      )} at {window.window_name}
                      
                    </p>
                    <Badge className="mt-2 bg-green-500 hover:bg-green-600">
                      Currently Serving
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-2xl text-gray-500 mb-4">No customers currently being served</p>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  All Windows Available
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next in Queue */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-800 text-center">
              Next in Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queue.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {queue.slice(0, 10).map((customer, index) => (
                  <div key={customer.id} className="text-center p-4 bg-gray-50 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-800 mb-2">
                      {customer.queue_number}
                      {customer?.isPriority && (
                          <Badge className="bg-orange-100 text-orange-800 text-sm">
                            <Star className="h-3 w-3 mr-1" />
                            Priority
                          </Badge>
                        )}
                    </div>
                    <Badge 
                      variant={index === 0 ? "default" : "secondary"}
                      className={index === 0 ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                    >
                      {index === 0 ? "Next Up" : `Position ${index + 1}`}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      Wait: {Math.floor((Date.now() - new Date(customer.timestamp).getTime()) / 60000)} min
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-2xl text-gray-500">No customers in queue</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-lg">Please wait for your number to be called and proceed to the indicated window</p>
          <div className="flex justify-center items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Next Up</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Currently Serving</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span>Closed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicDisplay

