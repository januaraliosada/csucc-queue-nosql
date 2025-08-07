import { useState, useEffect, useCallback, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Users, Clock, CheckCircle, AlertCircle, RotateCcw, Monitor, Star, Wifi, WifiOff } from 'lucide-react'
import websocketQueueStorage from './utils/websocketStorage.js'
import { useAuth } from './AuthContext'
import LazyCustomerQueue from './components/LazyCustomerQueue.jsx'
import './App.css'

function App() {
  const [queueState, setQueueState] = useState(null)
  const [selectedWindow, setSelectedWindow] = useState('')
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [resetPassword, setResetPassword] = useState('')

  const { logout } = useAuth()

  // Subscribe to queue state changes
  useEffect(() => {  
    const unsubscribe = websocketQueueStorage.subscribe((newState) => {
      setQueueState(newState)
    })

    let connectionIntervalId; // Declare a variable to hold the interval ID

    const startCheckingConnection = () => {
      // Clear any existing interval before starting a new one
      if (connectionIntervalId) {
        clearInterval(connectionIntervalId);
      }
      connectionIntervalId = setInterval(() => {
        console.log('Checking connection status...');
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
        console.log('Page is hidden, stopping connection check.');
        stopCheckingConnection();
      } else {
        console.log('Page is visible, starting connection check.');
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
      unsubscribe()
      stopCheckingConnection();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const handleAddCustomer = useCallback((isPriority = false) => {
    const newCustomer = websocketQueueStorage.addCustomer(isPriority)
    if (newCustomer) {
      console.log(`Added ${isPriority ? 'priority' : 'regular'} customer:`, newCustomer.queue_number)
    }
  }, [])

  const handleTogglePriority = useCallback((customerId) => {
    const success = websocketQueueStorage.toggleCustomerPriority(customerId)
    if (success) {
      console.log('Toggled priority for customer:', customerId)
    }
  }, [])

  const handleCallNext = useCallback(async () => {
    if (!selectedWindow) {
      alert('Please select a window first')
      return
    }
    
    const windowId = parseInt(selectedWindow)
    const customer = await websocketQueueStorage.callNextCustomer(windowId)

    if (customer) {
      console.log('Called customer to window', windowId)
    } else {
      alert('No customers in queue')
    }
  }, [selectedWindow])

  const handleRingNotification = useCallback(async () => {
    // Send ring notification via WebSocket
    await websocketQueueStorage.ringNotification()
  }, [])

  const handleCompleteService = useCallback(() => {
    if (!selectedWindow) {
      alert('Please select a window first')
      return
    }
    
    const windowId = parseInt(selectedWindow)
    const success = websocketQueueStorage.completeService(windowId)
    if (success) {
      console.log('Completed service at window', windowId)
    }
  }, [selectedWindow])

  const handleResetQueue = useCallback(() => {
    if (!resetPassword.trim()) {
      alert('Please enter the reset password')
      return
    }
    
    const success = websocketQueueStorage.resetQueue(resetPassword)
    if (success) {
      console.log('Queue reset request sent')
      setIsResetDialogOpen(false)
      setResetPassword('')
    }
  }, [resetPassword])

  const handleLogout = useCallback(() => {
    logout()
    console.log('Logged out successfully')
    setIsLogoutDialogOpen(false)
  }, [logout])

  const handlePrintQueue = useCallback(() => {
    const currentDate = new Date().toLocaleDateString('en-CA');
    const currentTime = new Date().toLocaleTimeString('en-GB');
    console.log(currentDate, currentTime);
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CSUCC Queue Cards</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 10px;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          
          .cards-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          
          .queue-card {
            border: 2px solid #333;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            background: #f9f9f9;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            page-break-inside: avoid;
            min-height: 50px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          
          .queue-card.priority {
            background: #fff3cd;
            border-color: #ffc107;
          }
          
          .queue-number {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
          }
          
          .priority-badge {
            background: #ffc107;
            color: #333;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 8px;
          }
          
          .card-info {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
          }
          
          .institution {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          
          @media print {
            .cards-container {
              grid-template-columns: repeat(6, 1fr);
            }
            
            .queue-card {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        
        <div class="cards-container">
          ${queueState.queue.map(customer => `
            <div class="queue-card">
              <div>
                <div class="queue-number">${customer.queue_number}</div>
              </div>
              <div class="card-info">
                <div>Validity: ${new Date(customer.timestamp).toLocaleDateString()}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=800,width=1000');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }, [queueState]);

  if (!queueState) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const { queue, windows, nextNumber } = queueState
  const selectedWindowData = windows.find(w => w.id === parseInt(selectedWindow))
  const currentlyServing = selectedWindowData?.current_customer || 'None'
  const avgWaitTime = queue.length > 0 ? Math.max(1, Math.floor(queue.length * 2.5)) : 0

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cashier Queue Management System</h1>
            <div className="flex items-center gap-4">
              <p className="text-gray-900 font-bold">{selectedWindowData?.window_name || 'None'}</p>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">Offline Mode</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedWindow} onValueChange={setSelectedWindow}>
              <SelectTrigger className="w-40">
                <Monitor className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select Window" />
              </SelectTrigger>
              <SelectContent>
                {windows.map((window) => (
                  <SelectItem key={window.id} value={window.id.toString()}>
                    {window.window_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={isResetDialogOpen} onOpenChange={(open) => {
              setIsResetDialogOpen(open)
              if (!open) setResetPassword('')
            }}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Queue
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Queue</DialogTitle>
                  <DialogDescription>
                    This will clear all customers from the queue and reset the numbering to C001. 
                    This action cannot be undone. Please enter the reset password to confirm.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-password">Reset Password</Label>
                    <Input
                      id="reset-password"
                      type="password"
                      placeholder="Enter reset password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleResetQueue()
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleResetQueue} disabled={!resetPassword.trim()}>
                    Reset Queue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Logout</DialogTitle>
                  <DialogDescription>
                    This will log you out and clear your session data. 
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleLogout}>
                    Logout
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={handlePrintQueue} variant="outline" size="sm">
              Print Queue
            </Button>
          </div>
        </div>

        {/* Warning if no window selected */}
        {!selectedWindow && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800">Please select your window to start serving customers</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total in Queue</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queue.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently Serving</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentlyServing}</div>
              {selectedWindowData && (
                <p className="text-xs text-muted-foreground">
                  at {selectedWindowData.window_name}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgWaitTime} min</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Number</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">C{String(nextNumber).padStart(3, '0')}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Currently Serving */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Currently Serving
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedWindowData?.current_customer ? (
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {selectedWindowData.current_customer}
                  </div>
                  <p className="text-gray-600">
                      {selectedWindowData.isPriority && (
                        <Badge className="bg-orange-100 text-orange-800 text-sm">
                          <Star className="h-3 w-3 mr-1" />
                          Priority
                        </Badge>
                      )} at {selectedWindowData.window_name}</p>
                  <Button 
                    onClick={handleCompleteService}
                    className="mt-4"
                    variant="outline"
                  >
                    Complete Service
                  </Button>
                  <br></br>
              
                  <Button 
                        onClick={handleRingNotification}
                    disabled={!selectedWindow || queue.length === 0}
                    className="mt-4 bg-blue-500 hover:bg-blue-600"
                  >
                    Ring the Bell
                  </Button>
                </div>
              ) : (
                <div className="text-center p-6">
                  <p className="text-gray-500 mb-4">No customer being served</p>
                  <Button 
                    onClick={handleCallNext}
                    disabled={!selectedWindow || queue.length === 0}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Call Next Customer
                  </Button>
                  {!selectedWindow && (
                    <p className="text-sm text-gray-500 mt-2">Select a window first</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queue Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Queue Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => handleAddCustomer(false)} 
                  disabled={!selectedWindow}
                  className="w-full"
                  variant="default"
                >
                  Add New Customer
                </Button>
                <Button 
                  onClick={() => handleAddCustomer(true)} 
                  disabled={!selectedWindow}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Add Priority Customer
                </Button>
              </div>
              
              <Button 
                onClick={handleCallNext}
                disabled={!selectedWindow || queue.length === 0}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                Call Next Customer
              </Button>
              
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">Queue Management</p>
                <Button 
                  onClick={() => setIsResetDialogOpen(true)}
                  variant="outline" 
                  className="w-full text-pink-600 border-pink-200 hover:bg-pink-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Waiting Queue */}
        <Suspense fallback={<div>Loading Queue...</div>}>
          <LazyCustomerQueue queue={queue} handleTogglePriority={handleTogglePriority} />
        </Suspense>
      </div>
    </div>
  )
}

export default App
