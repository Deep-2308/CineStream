import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Fail loudly if VITE_API_URL is missing
if (!import.meta.env.VITE_API_URL) {
  throw new Error(
    'VITE_API_URL is not defined. ' +
    'Create a .env file in the client directory with VITE_API_URL=http://localhost:5000'
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
