// Main JavaScript file for the Feather Agent Service UI

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Feather Agent Service UI initialized');
  
  // Check authentication status and update UI accordingly
  checkAuthStatus();
  
  // Add logout button event listener if it exists
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
});

/**
 * Check if the user is authenticated and update the UI
 */
function checkAuthStatus() {
  const accessToken = localStorage.getItem('access_token');
  const userEmail = localStorage.getItem('user_email');
  
  // Get UI elements
  const userMenu = document.getElementById('user-menu');
  const authLinks = document.getElementById('auth-links');
  const authPrompt = document.getElementById('auth-prompt');
  const publicCta = document.getElementById('public-cta');
  
  if (accessToken) {
    // User is logged in
    if (userMenu) userMenu.classList.remove('hidden');
    if (authLinks) authLinks.classList.add('hidden');
    
    // Set profile link text to user email
    const profileLink = document.getElementById('profile-link');
    if (profileLink && userEmail) {
      profileLink.textContent = userEmail;
    }
    
    // Make sure auth prompt is hidden
    if (authPrompt) authPrompt.classList.add('hidden');
    if (publicCta) publicCta.classList.add('hidden');
    
    // Make auth-required links just work normally
    document.querySelectorAll('.auth-required').forEach(link => {
      link.classList.remove('auth-required');
    });
  } else {
    // User is logged out
    if (userMenu) userMenu.classList.add('hidden');
    if (authLinks) authLinks.classList.remove('hidden');
    if (authPrompt) authPrompt.classList.remove('hidden');
    if (publicCta) publicCta.classList.remove('hidden');
    
    // If this is a protected page, redirect to login
    const currentPath = window.location.pathname;
    const publicPaths = ['/', '/login', '/register'];
    
    if (!publicPaths.includes(currentPath)) {
      localStorage.setItem('redirect_after_login', currentPath);
      window.location.href = '/login';
      return;
    }
    
    // Redirect auth-required links to login page
    document.querySelectorAll('.auth-required').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetUrl = link.getAttribute('href');
        localStorage.setItem('redirect_after_login', targetUrl);
        window.location.href = '/login';
      });
    });
  }
}

/**
 * Handle user logout
 */
function handleLogout(e) {
  e.preventDefault();
  
  // Clear all auth data from localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_email');
  
  // Redirect to home page
  window.location.href = '/';
}