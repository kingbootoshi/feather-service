/**
 * Common utility functions for Feather Service UI
 */

/**
 * Get authentication headers for API requests
 * @returns {Object} Headers object with Content-Type and Authorization
 */
function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

/**
 * Make an authenticated API request
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
async function apiRequest(url, options = {}) {
  // Ensure headers are set with authentication
  options.headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Try to parse error response
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error || `Request failed with status ${response.status}`;
      
      if (response.status === 401) {
        // Handle authentication errors
        console.error('Authentication error:', errorMessage);
        
        // If the user was previously logged in, clear auth data and redirect
        if (localStorage.getItem('access_token')) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_email');
          
          // Store current path for redirect after login
          localStorage.setItem('redirect_after_login', window.location.pathname);
          window.location.href = '/login';
        }
      }
      
      throw new Error(errorMessage);
    }
    
    return response;
    
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}