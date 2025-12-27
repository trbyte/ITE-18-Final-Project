// Global API configuration - works in both local and Vercel environments
window.getApiBase = function() {
  // If on Vercel or production (not localhost), use current origin
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  // Use localhost for development
  return 'http://localhost:5000';
};

// Set global API_BASE for backward compatibility
window.API_BASE = window.getApiBase();

