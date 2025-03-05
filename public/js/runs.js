// Runs JavaScript file for the Feather Agent Service UI

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Runs page initialized');
  
  // Auto-refresh in-progress runs
  setInterval(refreshInProgressRuns, 10000); // Refresh every 10 seconds
  
  function refreshInProgressRuns() {
    const inProgressRows = document.querySelectorAll('.run-row.running, .run-row.pending');
    
    if (inProgressRows.length > 0) {
      // Reload the page to get updated run statuses
      window.location.reload();
    }
  }
});