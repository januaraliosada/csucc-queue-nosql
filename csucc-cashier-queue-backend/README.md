# CSUCC Cashier Queue System - Backend

A robust and scalable NestJS backend for the CSUCC Cashier Queue System, providing real-time queue management and synchronization across multiple devices via WebSockets. This backend handles customer queuing, window assignments, and broadcasts state updates to all connected frontend clients.

## 🚀 Features

*   **Real-time Queue Synchronization:** Utilizes WebSockets to broadcast queue state updates to all connected clients in real-time.
*   **Customer Management:** API endpoints and WebSocket events for adding customers, calling the next customer, and completing service.
*   **Multi-Window Support:** Manages queue flow for multiple cashier windows.
*   **Authentication & Authorization:** Secures API endpoints and WebSocket connections using JWT (JSON Web Tokens) for staff login.
*   **Persistent Queue State:** Maintains the queue state, ensuring data consistency across disconnections and reconnections (currently in-memory, extendable to persistent storage).
*   **Scalable Architecture:** Built with NestJS, providing a modular and extensible foundation for future enhancements.
*   **Sound Notification Triggering:** Triggers sound notifications on frontend public displays for events like customer calls.

## 🛠️ Technical Stack

*   **Backend Framework:** NestJS (Node.js)
*   **WebSockets:** `@nestjs/platform-socket.io`
*   **Authentication:** Passport.js, JWT (JSON Web Tokens)
*   **Database:** In-memory (for simplicity, can be extended to a persistent database like PostgreSQL, MongoDB, etc.)
*   **Language:** TypeScript

## 📦 Installation & Setup

### Prerequisites

*   Node.js (v16+)
*   npm or pnpm

### Quick Start

1.  **Clone the project**
    
    ```shell
    git clone https://github.com/januaraliosada/csucc-cashier-queue-backend.git
    cd csucc-cashier-queue-backend
    ```
    
2.  **Install dependencies**
    
    ```shell
    npm install
    # or
    pnpm install
    ```
    
3.  **Set environment variables**
    
    *   Create a `.env` file in the root directory with the following:
        
            JWT_SECRET=your_jwt_secret_key # Choose a strong, unique secret
            ADMIN_USERNAME=admin # Default username for login
            ADMIN_PASSWORD=password # Default password for login
            
        
        _Note: For production, ensure `JWT_SECRET` is a strong, randomly generated string and consider more secure ways to manage credentials._
        
4.  **Compile and run the project**
    
    ```shell
    # development mode
    npm run start:dev
    # or
    pnpm run start:dev
    
    # production mode
    npm run start:prod
    # or
    pnpm run start:prod
    ```
    
    The backend server will typically run on `http://localhost:5000` (or the port configured in `main.ts`).
    

## 🖥️ Usage Guide

### API Endpoints (HTTP)

*   **`POST /auth/login`**: Authenticate and receive a JWT token.
    *   **Body:** `{ "username": "admin", "password": "password" }`
    *   **Response:** `{ "access_token": "<your_jwt_token>" }`

### WebSocket Events

Connect to the WebSocket server at `ws://localhost:5000` (or your deployed backend URL).

#### Emitting Events (from Frontend to Backend)

*   **`join_queue_room`**: Join the main queue room to receive updates.
    *   **Authentication:** Include the JWT token in the handshake `auth` property: `{ auth: { token: "<your_jwt_token>" } }`
*   **`add_customer`**: Add a new customer to the queue.
    *   **Payload:** `{ isPriority: boolean }`
*   **`call_next_customer`**: Call the next customer for a specific window.
    *   **Payload:** `{ windowId: number }`
*   **`complete_service`**: Mark service as complete for a window.
    *   **Payload:** `{ windowId: number }`
*   **`toggle_customer_priority`**: Toggle a customer's priority status.
    *   **Payload:** `{ customerId: number }` (Note: `customerId` is a number in `queue.gateway.ts`)
*   **`reset_queue`**: Reset the entire queue.
*   **`ring_notification`**: Trigger a ring notification on all public displays.

#### Listening to Events (from Backend to Frontend)

*   **`queue_state_update`**: Receives the latest queue state.
    *   **Payload:** `QueueState` object (contains `queue`, `windows`, `nextNumber`, `lastUpdated`)
*   **`play_ring_notification`**: Instructs the frontend to play a ring sound.

## 🌐 Deployment

To deploy the NestJS backend, you can use various methods such as Docker, PM2, or cloud platforms like AWS, Google Cloud, or Azure. Ensure that the chosen deployment method allows for WebSocket connections.

### Production Build

```shell
npm run build
# or
pnpm run build
```

This will compile the TypeScript code into JavaScript in the `dist` directory.

### Running in Production

```shell
node dist/main
```

## 🔄 Synchronization Details

*   The backend acts as the single source of truth for the queue state.
*   All actions (add, call, complete, reset) are processed by the backend.
*   Upon any state change, the backend emits a `queue_state_update` event to all connected WebSocket clients, ensuring real-time synchronization.
*   Authentication is handled via JWT tokens passed during the WebSocket handshake, securing access to queue management operations.

## 🔧 Troubleshooting

**Authentication Errors (e.g., `Cannot read properties of undefined (reading 'authorization')`)**

*   Ensure your frontend is sending the JWT token correctly in the WebSocket handshake `auth` property.
*   Verify that the `JwtStrategy` in the backend is correctly configured to extract the token from the WebSocket handshake.
*   Check the `IoAdapter` setup in `main.ts` to ensure proper WebSocket handling and authentication integration.

**WebSocket Connection Issues**

*   Verify the backend server is running and accessible on the specified port (e.g., 5000).
*   Check firewall settings on the server.
*   Ensure the frontend `VITE_WEBSOCKET_URL` environment variable points to the correct backend address.

## 📄 License

MIT License — see [LICENSE]() for details.

## 🤝 Support

For issues or feature requests, please use the GitHub Issues page or contact your system administrator.

_Built with ❤️ for efficient queue management at CSUCC cashier counters_

