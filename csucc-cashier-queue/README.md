# CSUCC Cashier Queue System - Frontend

A modern, real-time web-based queuing system designed for the CSUCC cashier environment. This system organizes customer flow, prevents queue overtaking, supports priority queuing, and provides professional audio notifications. It features robust multi-device synchronization powered by a WebSocket backend, ensuring seamless updates across all interfaces.

## 🚀 Features

### Core Queue Management

*   **Real-time Queue Processing:** Add customers, call next customer, complete service.
*   **Strict Queue Order:** FIFO (First In, First Out) enforcement; prevents overtaking.
*   **Priority Queuing:** Mark customers as priority for faster service.
*   **Multi-Window Support:** Configurable number of windows (2 by default).
*   **Daily Queue Reset:** Reset queue numbering at the start of each day or shift.
*   **Professional UI:** Clean, modern interface for business environments.

### Authentication

*   **Login/Logout for Window Interface:** Only authorized staff can manage the queue (credentials set via environment variables).

### Sound Notifications

*   **Audio Feedback:** Two-tone chime when calling next customer.
*   **Web Audio API:** High-quality, professional notification sound with fallback.
*   **Accessibility:** Audio helps visually-impaired customers.
*   **Ring Bell Notification:** Staff can trigger a bell sound notification across all connected displays to alert customers.
*   **Browser Autoplay Policy Compliance:** AudioContext is initialized and resumed only after a user gesture (click, keydown, touchstart) to comply with modern browser policies, ensuring sound plays correctly after page reloads.

### Dual Interface System with Multi-Device Synchronization

This system supports real-time synchronization across multiple devices, allowing for a cohesive experience between staff and customers.

*   **Window Interface (`/window`):** Full queue management for staff (login required). This interface allows cashiers to manage the queue, call customers, and complete services, with all actions instantly reflected on public displays.
*   **Public Display (`/display`):** Customer-facing queue status display. This interface provides real-time updates on the current queue, serving windows, and estimated wait times, ensuring customers are well-informed.
*   **Home Page (`/`):** Interface selection and navigation.

### Real-Time Synchronization

*   **WebSocket-Powered Sync:** State is synchronized across multiple browser tabs or devices on the same network using a WebSocket backend, ensuring immediate updates.
*   **localStorage & BroadcastChannel Fallback:** While primarily WebSocket-driven, the system includes `localStorage` and `BroadcastChannel` as a fallback mechanism if the WebSocket connection is unavailable.

## 🎯 Perfect For

*   University cashier counters (e.g., CSUCC)
*   Retail stores and service centers
*   Clinics and medical facilities
*   Banks and financial institutions
*   Government service offices

## 🛠️ Technical Stack

*   **Frontend:** React 18 + Vite
*   **Styling:** Tailwind CSS, shadcn/ui
*   **State Management:** WebSocket (primary), localStorage + BroadcastChannel API (fallback)
*   **Audio:** Web Audio API with user gesture compliance
*   **Icons:** Lucide React
*   **Deployment:** Static files (frontend) and a WebSocket server (backend).

## 📦 Installation & Setup

### Prerequisites

*   Node.js (v16+)
*   npm or pnpm
*   A NestJS WebSocket backend (refer to the `csucc-cashier-queue-backend` repository) is required for full multi-device synchronization.

### Quick Start

1.  **Clone the project**
    
    ```shell
    git clone https://github.com/januaraliosada/csucc-cashier-queue.git
    cd csucc-cashier-queue
    ```
    
2.  **Set environment variables for login (optional, for production)**
    
    *   Create a `.env` file with:
        
            VITE_USERNAME=your_username
            VITE_PASSWORD=your_password
            VITE_WEBSOCKET_URL=ws://localhost:5000 # Or your backend WebSocket URL
        
3.  **Install dependencies**
    
    ```shell
    pnpm install
    # or
    npm install
    ```
    
4.  **Start development server**
    
    ```shell
    pnpm run dev
    # or
    npm run dev
    ```
    
5.  **Open in browser**
    
    *   Go to `http://localhost:5173`
    *   Choose Window Interface (login required) or Public Display

### Backend Setup (Crucial for Multi-Device Sync)

For the multi-device synchronization to function, a NestJS WebSocket backend server must be running. This project expects a NestJS backend that handles the queue state and broadcasts updates to connected clients. Refer to the `csucc-cashier-queue-backend` repository for setup instructions and ensure your backend is accessible from your frontend deployment.

## 🖥️ Usage Guide

### For Staff (Window Interface)

1.  **Login:** Enter your credentials to access `/window`.
2.  **Select Window:** Choose your window number (1 or 2 by default).
3.  **Add Customers:** Click "Add New Customer" (optionally set as Priority).
4.  **Call Next:** Click "Call Next Customer"—system plays a chime and assigns customer to your window.
5.  **Complete Service:** Click "Complete Service" when done.
6.  **Ring the Bell:** Click "Ring the Bell" to send an audio notification to all public displays.
7.  **Reset Queue:** Use "Reset Queue" to start a new day/shift (confirmation required).

### For Customers (Public Display)

1.  **Open `/display`:** View current queue and which customer is being served.
2.  **Monitor Status:** See waiting list, now serving, and which window is available. Updates are real-time across all connected displays.
3.  **Enable Sound:** Click or press any key on the page to enable sound notifications (required by browser autoplay policies).

## 🔧 Configuration

*   **Number of Windows:** Default is 2 (see `src/utils/queueStorage.js`). You can add more as needed.
*   **Priority Label:** Customers can be marked as priority at entry or toggled in the queue.
*   **Sound Settings:** Default is two-tone chime (880Hz + 660Hz); customizable in `src/utils/soundNotification.js`.
*   **Queue Numbering:** Format is C001, C002, etc; resets daily; prefix can be changed in the code.

## 🌐 Deployment

*   **Frontend Static Hosting:** Deploy `dist/` to Netlify, Vercel, GitHub Pages, AWS S3, or any static web server.
    
*   **Production Build:**
    
    ```shell
    pnpm run build
    # or
    npm run build
    ```
    
    The `dist/` folder will contain all static files for deployment.
    
*   **Local Network:** Serve `dist/` on your LAN so multiple devices can use the system.
    
*   **Backend Deployment:** The NestJS WebSocket backend server needs to be deployed separately. Ensure it is accessible from your frontend deployment.

## 🔄 Synchronization Details

*   **WebSocket Protocol:** Utilizes WebSocket for real-time, bidirectional communication between the frontend and the backend server.
*   **Event-Driven Updates:** All queue state changes (adding, calling, completing, resetting) are sent as events to the backend, which then broadcasts the updated state to all connected clients.
*   **Fallback Mechanism:** In case of WebSocket connection issues, the system gracefully falls back to `localStorage` and `BroadcastChannel` for local synchronization, ensuring basic functionality.

## 🎵 Sound System

*   **Audio Triggers:** Plays when a customer is called and when the "Ring the Bell" notification is triggered; plays on both staff and public displays.
*   **Browser Compliance:** Works with modern browsers, respects autoplay policies, and requires user gesture for initial audio playback.
*   **Accessible:** Designed to be non-intrusive but clearly noticeable.

## 🚀 Advanced Features

*   **Multi-Station:** Multiple window interfaces and displays stay in sync.
*   **Offline-Ready:** Works without internet; resumes sync when online (using fallback).
*   **Mobile Responsive:** Supports desktops, tablets, and phones.

## 🔧 Troubleshooting

**Sound not playing?**

*   Ensure user has interacted with page (click/keypress) to enable audio.
*   Check browser audio permissions and volume.

**Synchronization not working?**

*   **Verify Backend:** Ensure your NestJS WebSocket backend server is running and accessible.
*   All devices must use the same site/domain and network.
*   Ensure `localStorage` is enabled.
*   Refresh all tabs.

**Queue reset not working?**

*   Confirm reset in dialog.
*   Avoid simultaneous reset from multiple windows.

## 📄 License

MIT License — see [LICENSE](LICENSE.md) for details.

## 🤝 Support

For issues or feature requests, please use the GitHub Issues page or contact your system administrator.

_Built with ❤️ for efficient queue management at CSUCC cashier counters_

