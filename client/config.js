// API Configuration - Automatically detects environment
const getApiBase = () => {
  // Check if we're in production (Vercel)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Use the current origin (Vercel URL) for production
    return window.location.origin;
  }
  // Use localhost for development
  return 'http://localhost:5000';
};

export const API_BASE = getApiBase();

