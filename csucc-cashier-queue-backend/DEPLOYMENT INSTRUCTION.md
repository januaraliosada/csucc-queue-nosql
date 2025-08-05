# NestJS Backend Integration and Deployment Instructions

This document provides instructions on how to integrate the newly created NestJS WebSocket backend with your existing frontend application and how to deploy it.

## 1. Backend Overview

The NestJS backend provides real-time queue management and synchronization via WebSockets. It exposes the following functionalities:

*   **Queue State Management:** Maintains the current state of the queue, including customers waiting, windows status, and next available queue number.
*   **Real-time Updates:** Broadcasts queue state updates to all connected clients in real-time.
*   **API Endpoints (WebSocket Events):**
    *   `join_queue_room`: Client joins the queue room to receive updates.
    *   `leave_queue_room`: Client leaves the queue room.
    *   `add_customer`: Adds a new customer to the queue (can be priority).
    *   `call_next_customer`: Calls the next customer in the queue to a specified window.
    *   `complete_service`: Marks the service as complete for a given window.
    *   `toggle_customer_priority`: Toggles the priority status of a customer.
    *   `reset_queue`: Resets the entire queue.
    *   `ring_notification`: Triggers a ring bell notification across all connected clients.

## 2. Frontend Integration

Your existing frontend (`csucc-cashier-queue`) is already set up to use a WebSocket client (`socket.io-client`) and expects a backend running on `http://localhost:5000` during development. For production, it attempts to connect to the same host as the frontend on port `5000`.

To integrate with this NestJS backend, you primarily need to ensure your frontend's `src/utils/websocketStorage.js` is correctly pointing to the backend's URL.

### 2.1. Verify Frontend WebSocket Configuration

Open `csucc-cashier-queue/src/utils/websocketStorage.js`.

Ensure the `socketUrl` logic correctly identifies and connects to your NestJS backend. The current implementation tries `http://localhost:5000` for local development and then `window.location.protocol}//${host}:5000` for other environments. This should work out-of-the-box if your NestJS backend is running on port `5000`.

```javascript
// Inside src/utils/websocketStorage.js

// Determine backend URL based on current location
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const host = window.location.hostname
const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80')

let socketUrl
if (host === 'localhost' || host === '127.0.0.1') {
  socketUrl = 'http://localhost:5000' // For local development
} else {
  // For production/other environments, assume backend is on port 5000 of the same host
  socketUrl = `${window.location.protocol}//${host}:5000`
}

this.socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  reconnection: true,
  reconnectionAttempts: this.maxReconnectAttempts,
  reconnectionDelay: this.reconnectDelay
})
```

**Important:** If you deploy your NestJS backend to a different domain or port, you will need to update the `socketUrl` logic in `websocketStorage.js` to point to the correct backend address.

### 2.2. Running Frontend with Backend

1.  **Start the NestJS Backend:**
    Navigate to the `cashier-queue-backend` directory and start the server:
    ```bash
    cd /home/ubuntu/cashier-queue-backend
    npm run start
    ```
    The backend should start and listen on port `5000`.

2.  **Start the Frontend Application:**
    In a separate terminal, navigate to your frontend project (`csucc-cashier-queue`) and start it:
    ```bash
    cd /home/ubuntu/csucc-cashier-queue
    npm run dev
    ```
    Open your frontend in the browser (e.g., `http://localhost:5173`). The frontend should now connect to the NestJS backend via WebSockets, and all queue operations will be synchronized in real-time.

## 3. Backend Deployment

Deploying the NestJS backend involves building the application and then running it on a server. Here are general steps:

### 3.1. Build the NestJS Application

First, build the NestJS application for production:

```bash
cd /home/ubuntu/cashier-queue-backend
npm run build
```

This command compiles the TypeScript code into JavaScript and places the output in the `dist` directory.

### 3.2. Running in Production

To run the built application in production, you can use `node` to execute the compiled `main.js` file:

```bash
cd /home/ubuntu/cashier-queue-backend
node dist/main
```

For continuous operation and process management in a production environment, it is highly recommended to use a process manager like PM2 or Docker.

#### Using PM2 (Recommended for Node.js Applications)

1.  **Install PM2 globally:**
    ```bash
    npm install -g pm2
    ```

2.  **Start your application with PM2:**
    ```bash
    pm2 start dist/main.js --name cashier-queue-backend
    ```

3.  **Save PM2 process list (to restart on server reboot):**
    ```bash
    pm2 save
    ```

4.  **Monitor your application:**
    ```bash
    pm2 monit
    ```

#### Using Docker

For containerized deployments, you would typically create a `Dockerfile` for your NestJS application. Here's a basic example:

```dockerfile
# Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the built application files
COPY dist ./dist

# Expose the port the app runs on
EXPOSE 5000

# Run the application
CMD [ "node", "dist/main" ]
```

Build and run your Docker image:

```bash
docker build -t cashier-queue-backend .
docker run -p 5000:5000 cashier-queue-backend
```

### 3.3. Firewall Configuration

Ensure that port `5000` (or whatever port your NestJS backend listens on) is open in your server's firewall to allow incoming connections from your frontend and other clients.

## 4. Cross-Origin Resource Sharing (CORS)

The NestJS backend is configured with CORS enabled for all origins (`*`) and common methods (`GET`, `POST`). This allows your frontend, regardless of its domain, to communicate with the backend. If you need more restrictive CORS policies in a production environment, you should update `src/main.ts`:

```typescript
// Inside src/main.ts

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ["https://your-frontend-domain.com"], // Specify your frontend domain(s)
    methods: ["GET", "POST"],
    credentials: true, // If you are using cookies or authorization headers
  });
  await app.listen(5000);
}
```

Remember to replace `"https://your-frontend-domain.com"` with the actual domain(s) where your frontend is hosted.

## 5. Next Steps

1.  **Deploy the NestJS Backend:** Choose a suitable hosting environment (e.g., a VPS, cloud platform like AWS EC2, Google Cloud Run, or a Docker-compatible service) and deploy your NestJS application.
2.  **Update Frontend `websocketStorage.js`:** If your backend is deployed to a different URL than `http://localhost:5000`, update the `socketUrl` in your frontend's `src/utils/websocketStorage.js` to point to the deployed backend URL.
3.  **Deploy Frontend:** Deploy your frontend application as usual. Ensure it can reach the deployed backend.

By following these steps, you will have a fully functional cashier queue system with real-time multi-device synchronization.

