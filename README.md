# CSUCC Cashier Queue System

This repository contains the updated CSUCC Cashier Queue System, which has been enhanced with a persistent NoSQL database (MongoDB) for robust data storage and improved scalability. The system facilitates real-time queue management for cashier operations, ensuring a seamless experience for both staff and customers.

## Table of Contents

- [CSUCC Cashier Queue System](#csucc-cashier-queue-system)
  - [Table of Contents](#table-of-contents)
  - [System Features](#system-features)
  - [System Architecture](#system-architecture)
    - [Before (localStorage)](#before-localstorage)
    - [After (MongoDB Integration)](#after-mongodb-integration)
  - [Deployment Guide](#deployment-guide)
    - [Prerequisites](#prerequisites)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
  - [System Improvements](#system-improvements)
  - [Future Enhancements](#future-enhancements)
  - [License](#license)

## System Features

The CSUCC Cashier Queue System offers the following key features:

*   **Real-time Queue Synchronization**: Utilizes WebSockets to broadcast queue state updates to all connected clients in real-time, ensuring immediate updates across multiple devices.
*   **Customer Management**: Provides functionalities for adding customers to the queue (including priority customers), calling the next customer to a window, and completing service.
*   **Multi-Window Support**: Manages queue flow efficiently across multiple cashier windows.
*   **Authentication & Authorization**: Secures API endpoints and WebSocket connections using JWT (JSON Web Tokens) for staff login.
*   **Persistent Queue State**: Maintains the queue state persistently in a MongoDB database, ensuring data consistency even across disconnections and server restarts.
*   **Sound Notification Triggering**: Triggers sound notifications on public displays for events like customer calls.
*   **Print Queue**: Allows printing of queue cards for customers.

## System Architecture

### Before (localStorage)

Initially, the system relied on `localStorage` and `BroadcastChannel` for frontend state management and an in-memory solution for the backend. This provided basic real-time synchronization but lacked data persistence and scalability.

```
Frontend ↔ localStorage + BroadcastChannel ↔ Frontend
```

### After (MongoDB Integration)

The system has been upgraded to use MongoDB, providing a robust and persistent data store. The backend now acts as the single source of truth, with all state changes being managed through the database and broadcasted via WebSockets.

```
Frontend ↔ WebSocket ↔ NestJS Backend ↔ MongoDB
```

## Deployment Guide

This guide provides instructions to set up and run the CSUCC Cashier Queue System with MongoDB integration.

### Prerequisites

Ensure you have the following installed on your system:

*   **Node.js**: Version 16 or higher.
*   **npm** or **pnpm**: Package managers for Node.js.
*   **MongoDB**: Version 7.0 or higher. You can install MongoDB Community Edition by following the official MongoDB documentation for your operating system. For Ubuntu, you can use the following commands:
    ```bash
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt update
    sudo apt install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
    ```

### Backend Setup

1.  **Clone the backend repository:**
    ```bash
    git clone https://github.com/januaraliosada/csucc-cashier-queue-backend.git
    cd csucc-cashier-queue-backend
    ```

2.  **Install backend dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Set environment variables:**
    Create a `.env` file in the root of the `csucc-cashier-queue-backend` directory with the following content. Replace `your_jwt_secret_key` with a strong, unique secret.
    ```
    MONGODB_URI=mongodb://localhost:27017/csucc-queue
    JWT_SECRET=your_jwt_secret_key
    ADMIN_USERNAME=admin
    ADMIN_PASSWORD=password
    ```
    *Note: For production environments, consider more secure ways to manage credentials and use a dedicated MongoDB instance.*

4.  **Start the backend server:**
    ```bash
    npm run start:dev
    # or for production
    # npm run start:prod
    ```
    The backend server will typically run on `http://localhost:5000`.

### Frontend Setup

1.  **Clone the frontend repository:**
    ```bash
    git clone https://github.com/januaraliosada/csucc-cashier-queue.git
    cd csucc-cashier-queue
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Configure WebSocket URL:**
    Create a `.env` file in the root of the `csucc-cashier-queue` directory and point `VITE_WEBSOCKET_URL` to your backend server address:
    ```
    VITE_WEBSOCKET_URL=http://localhost:5000
    ```
    *Adjust the URL if your backend is running on a different host or port.*

4.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend application will typically be accessible at `http://localhost:5173/`.

## System Improvements

The migration from `localStorage` to MongoDB has brought significant improvements to the CSUCC Cashier Queue System:

1.  **Data Persistence**: All queue data, customer information, and window states are now stored persistently in MongoDB. This means data survives server restarts and system reboots, eliminating the risk of data loss.
2.  **Enhanced Scalability**: The system can now handle a larger volume of customers and multiple concurrent users more efficiently. MongoDB's architecture supports horizontal scaling, allowing the system to grow with demand.
3.  **Improved Data Integrity**: By centralizing data management in MongoDB, the system ensures better data consistency and integrity across all connected clients and backend processes.
4.  **Historical Tracking**: The new database structure allows for easy tracking of customer service history, including joined times, served times, and completion times. This opens up possibilities for future analytics and reporting.
5.  **Analytics Readiness**: The structured data in MongoDB is well-suited for generating insights into queue performance, peak hours, and customer flow, which can be leveraged for operational improvements.
6.  **Multi-Instance Support**: Multiple backend instances can now connect to and share the same MongoDB database, enabling more robust and highly available deployments.

## Future Enhancements

Building upon the new MongoDB-based architecture, several future enhancements are now feasible:

1.  **Customer Analytics**: Develop dashboards and reports to analyze customer service times, identify peak hours, and understand customer patterns.
2.  **Historical Reporting**: Implement features to generate daily, weekly, and monthly reports on queue activity, service efficiency, and customer satisfaction.
3.  **Multi-Location Support**: Extend the system to manage queues across multiple cashier locations or branches from a centralized database.
4.  **Advanced Queue Management**: Introduce features like appointment scheduling, estimated wait times, and automated customer routing based on service type or priority.
5.  **Performance Monitoring**: Integrate advanced monitoring tools to track database performance, application response times, and WebSocket latency, ensuring optimal system operation.
6.  **User Management Interface**: Develop a dedicated interface for managing staff accounts, roles, and permissions.

## License

This project is licensed under the MIT License. See the `LICENSE.md` file for details.


