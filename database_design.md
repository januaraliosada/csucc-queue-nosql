# NoSQL Database Design for CSUCC Cashier Queue System

## 1. Introduction

This document outlines the design for integrating a NoSQL database into the CSUCC Cashier Queue System. The current system utilizes `localStorage` and `BroadcastChannel` for frontend state management and an in-memory solution for the backend. This proposal aims to replace these temporary storage mechanisms with a persistent NoSQL database, enhancing data consistency, scalability, and reliability.

## 2. Database Selection: MongoDB

MongoDB has been selected as the NoSQL database for this system due to its flexibility, scalability, and strong support within the NestJS framework (the backend's technology stack). Its document-oriented model is well-suited for handling the dynamic and evolving nature of queue data, such as customer information and window states.

## 3. Schema Design

We will primarily use two collections: `customers` and `queue_state`. While the `queue_state` will hold the overall system state, the `customers` collection will store individual customer details, allowing for more granular management and historical tracking if needed in the future.

### 3.1. `customers` Collection

This collection will store details for each customer that enters the queue. This allows for individual customer tracking and potential future features like customer history or analytics.

**Document Structure:**

```json
{
  "_id": "<ObjectId>",
  "queue_number": "C001",
  "isPriority": false,
  "joinedAt": "<ISODate>",
  "status": "waiting", // or "serving", "completed", "skipped"
  "windowId": null, // ID of the window currently serving the customer, if applicable
  "servedAt": null, // Timestamp when service started
  "completedAt": null // Timestamp when service completed
}
```

**Field Descriptions:**

*   `_id`: MongoDB's default primary key, an ObjectId.
*   `queue_number`: A unique identifier for the customer in the queue (e.g., "C001").
*   `isPriority`: Boolean indicating if the customer has priority status.
*   `joinedAt`: Timestamp (ISO Date) when the customer joined the queue.
*   `status`: Current status of the customer in the queue. Possible values include:
    *   `waiting`: Customer is in the queue, waiting to be called.
    *   `serving`: Customer is currently being served at a window.
    *   `completed`: Customer's service has been completed.
    *   `skipped`: Customer was skipped (e.g., no-show).
*   `windowId`: (Optional) The ID of the window currently serving this customer. Null if not being served.
*   `servedAt`: (Optional) Timestamp when the customer started being served. Null if not being served.
*   `completedAt`: (Optional) Timestamp when the customer's service was completed. Null if not completed.

### 3.2. `queue_state` Collection

This collection will store the overall, real-time state of the queue system, including the order of customers in the queue, the status of each service window, and the next available queue number. This collection will likely have only one document, representing the singleton state of the entire system.

**Document Structure:**

```json
{
  "_id": "<ObjectId>",
  "current_queue": ["<ObjectId_customer1>", "<ObjectId_customer2>"], // Array of customer _ids in queue order
  "windows": [
    {
      "id": 1,
      "window_name": "Window 1",
      "status": "available", // or "serving", "closed"
      "current_customer_id": null // ObjectId of the customer currently being served
    },
    {
      "id": 2,
      "window_name": "Window 2",
      "status": "available",
      "current_customer_id": null
    }
  ],
  "next_customer_number": 1,
  "lastUpdated": "<ISODate>"
}
```

**Field Descriptions:**

*   `_id`: MongoDB's default primary key, an ObjectId. This document will likely have a fixed `_id` (e.g., a hardcoded string or a specific ObjectId) to ensure it's a singleton.
*   `current_queue`: An ordered array of `_id`s from the `customers` collection, representing the current order of customers in the queue. This allows for efficient reordering and retrieval of customers.
*   `windows`: An array of objects, each representing a service window.
    *   `id`: Unique identifier for the window (e.g., 1, 2).
    *   `window_name`: Display name for the window (e.g., "Window 1").
    *   `status`: Current status of the window. Possible values include:
        *   `available`: Window is open and ready to serve.
        *   `serving`: Window is currently serving a customer.
        *   `closed`: Window is closed.
    *   `current_customer_id`: (Optional) The `_id` of the customer currently being served at this window. Null if no customer is being served.
*   `next_customer_number`: The next sequential number to be assigned to a new customer (e.g., 1, 2, 3...). This will be used to generate `queue_number` for new customers.
*   `lastUpdated`: Timestamp (ISO Date) of the last update to the queue state.

## 4. Data Flow and Logic

1.  **Initialization:** On application startup, the backend will check if a `queue_state` document exists. If not, it will create one with default values (empty queue, available windows, `next_customer_number` starting from 1).
2.  **Adding a Customer:**
    *   When a new customer is added, the backend will:
        *   Generate a `queue_number` using `next_customer_number` from `queue_state`.
        *   Create a new document in the `customers` collection with `status: "waiting"`.
        *   Add the `_id` of the new customer to the `current_queue` array in the `queue_state` document, maintaining priority order.
        *   Increment `next_customer_number` in `queue_state`.
        *   Emit a `queue_state_update` WebSocket event to all connected clients.
3.  **Calling Next Customer:**
    *   When a cashier calls the next customer for a window, the backend will:
        *   Retrieve the first customer `_id` from `current_queue` in `queue_state`.
        *   Remove this `_id` from `current_queue`.
        *   Update the corresponding customer document in the `customers` collection: set `status: "serving"`, `windowId` to the serving window's ID, and `servedAt` timestamp.
        *   Update the `windows` array in `queue_state`: set the window's `status` to `serving` and `current_customer_id` to the served customer's `_id`.
        *   Emit a `queue_state_update` WebSocket event.
4.  **Completing Service:**
    *   When a cashier completes service for a customer at a window, the backend will:
        *   Retrieve the `current_customer_id` from the relevant window in `queue_state`.
        *   Update the corresponding customer document in the `customers` collection: set `status: "completed"` and `completedAt` timestamp.
        *   Update the `windows` array in `queue_state`: set the window's `status` to `available` and `current_customer_id` to `null`.
        *   Emit a `queue_state_update` WebSocket event.
5.  **Resetting Queue:**
    *   When the queue is reset, the backend will:
        *   Clear the `current_queue` array in `queue_state`.
        *   Reset `next_customer_number` to 1 in `queue_state`.
        *   Update all window statuses in `queue_state` to `available` and `current_customer_id` to `null`.
        *   Optionally, update the `status` of all `customers` documents to `skipped` or `completed` based on business logic, or archive them.
        *   Emit a `queue_state_update` WebSocket event.

## 5. Backend Implementation Considerations

*   **NestJS Mongoose:** Utilize the `@nestjs/mongoose` package for seamless integration with MongoDB, defining schemas and models for `Customer` and `QueueState`.
*   **Services:** Create dedicated services (e.g., `CustomerService`, `QueueService`) to encapsulate database interactions and business logic.
*   **WebSockets:** The existing WebSocket gateway will be modified to interact with the database services instead of in-memory data. All state changes will trigger a `queue_state_update` event broadcasting the latest state fetched from the database.
*   **Authentication:** The existing JWT authentication will remain in place to secure API endpoints and WebSocket connections.

## 6. Frontend Implementation Considerations

*   **API Calls:** The frontend will no longer directly manage state via `localStorage`. Instead, it will make API calls to the backend for actions like adding customers, calling next, completing service, and resetting the queue.
*   **WebSocket Listener:** The frontend will continue to listen to the `queue_state_update` WebSocket event from the backend. Upon receiving an update, it will re-render its UI based on the new state received from the backend.
*   **`queueStorage.js` Refactor:** The `queueStorage.js` utility will be refactored to remove `localStorage` and `BroadcastChannel` dependencies, and instead, rely entirely on WebSocket updates from the backend. It will essentially become a state management layer that consumes backend WebSocket events.

## 7. Migration Strategy (if applicable)

For existing deployments, a migration script would be necessary to transfer any `localStorage` data into the new MongoDB database. However, given the nature of a queue system, it's likely acceptable to start with an empty database for the first deployment of the updated system.

## 8. Conclusion

Integrating MongoDB will provide a robust and persistent data store for the CSUCC Cashier Queue System, resolving the limitations of `localStorage` and in-memory solutions. This design ensures data consistency, supports real-time updates, and lays the groundwork for future scalability and feature enhancements.

