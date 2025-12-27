// API Configuration - Automatically detects environment
// Works in both module and non-module contexts
(function() {
  const getApiBase = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    // Check if we're in production (Vercel or any non-localhost domain)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
      // Use the current origin (Vercel URL) for production
      // This will be something like https://your-project.vercel.app
      return window.location.origin;
    }
    // Use localhost for development
    return 'http://localhost:5000';
  };

  // Make API_BASE available globally immediately
  window.API_BASE = getApiBase();
  
  // Log for debugging (remove in production if needed)
  console.log('API_BASE configured:', window.API_BASE);
  console.log('Current location:', window.location.href);
  
  // Also export for ES6 modules if needed
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE: window.API_BASE };
  }
})();

