import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';

// Fail loudly if VITE_API_URL is missing
if (!import.meta.env.VITE_API_URL) {
  throw new Error(
    'VITE_API_URL is not defined. ' +
    'Create a .env file in the client directory with VITE_API_URL=http://localhost:5000'
  );
}

if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
  throw new Error(
    'VITE_GOOGLE_CLIENT_ID is not defined. ' +
    'Check your client .env file.'
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
