# CineStream

CineStream is an AI-powered movie discovery and streaming platform. This repository contains both the React/Vite frontend (in `/client`) and the Express/Node backend (in `/server`).

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Setup Instructions

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository_url>
   cd CineStream
   ```

2. **Install Client Dependencies**:
   ```bash
   cd client
   npm install
   ```
   *Copy the example environment file and update it:*
   ```bash
   cp .env.example .env
   ```

3. **Install Server Dependencies**:
   ```bash
   cd ../server
   npm install
   ```
   *Copy the example environment file and update it with real values (e.g., MONGODB_URI):*
   ```bash
   cp .env.example .env
   ```

### Running the App Locally

Open two separate terminal windows.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```
The server will start on port 5000 (or the port specified in your `.env`).

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
The client will start on its default Vite port (usually 5173).
