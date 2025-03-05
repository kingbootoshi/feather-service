// Run Details JavaScript file for the Feather Agent Service UI

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Run Details page initialized');
  
  // Get elements
  const runLoading = document.getElementById('run-loading');
  const runDetails = document.getElementById('run-details');
  const runNotFound = document.getElementById('run-not-found');
  const runId = document.getElementById('run-id');
  const runType = document.getElementById('run-type');
  const runStatus = document.getElementById('run-status');
  const runCreated = document.getElementById('run-created');
  const runCompleted = document.getElementById('run-completed');
  const runInputContent = document.getElementById('run-input-content');
  const runStepsContainer = document.getElementById('run-steps-container');
  const runOutputContent = document.getElementById('run-output-content');
  const runError = document.getElementById('run-error');
  const runErrorContent = document.getElementById('run-error-content');
  
  // Fetch the run details
  fetchRunDetails();
  
  // Set up auto-refresh for in-progress runs
  let refreshInterval;
  
  async function fetchRunDetails() {
    try {
      const response = await fetch(`/api/pipelines/runs/${runId}`);
      
      if (response.status === 404) {
        // Run not found
        runLoading.classList.add('hidden');
        runDetails.classList.add('hidden');
        runNotFound.classList.remove('hidden');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch run details');
      }
      
      const run = await response.json();
      console.log('Run details:', run);
      
      // Update the UI with the run details
      runId.textContent = run.id;
      runType.textContent = run.pipelineId ? 'Pipeline' : 'Agent';
      runStatus.textContent = run.status;
      runCreated.textContent = new Date(run.createdAt).toLocaleString();
      runCompleted.textContent = run.completedAt ? new Date(run.completedAt).toLocaleString() : 'Not completed';
      
      // Input
      runInputContent.textContent = run.input;
      
      // Steps/Outputs
      runStepsContainer.innerHTML = '';
      run.outputs.forEach((output, index) => {
        const stepOutput = document.createElement('div');
        stepOutput.className = 'step-output';
        stepOutput.innerHTML = `
          <h5>Step ${index + 1}: ${output.agentId}</h5>
          <p><strong>Time:</strong> ${new Date(output.timestamp).toLocaleString()}</p>
          <pre>${typeof output.output === 'string' ? output.output : JSON.stringify(output.output, null, 2)}</pre>
        `;
        runStepsContainer.appendChild(stepOutput);
      });
      
      // Final output
      if (run.finalOutput) {
        runOutputContent.textContent = typeof run.finalOutput === 'string' 
          ? run.finalOutput 
          : JSON.stringify(run.finalOutput, null, 2);
      } else {
        runOutputContent.textContent = 'No final output available yet';
      }
      
      // Error (if any)
      if (run.error) {
        runError.classList.remove('hidden');
        runErrorContent.textContent = run.error;
      } else {
        runError.classList.add('hidden');
      }
      
      // Show the details
      runLoading.classList.add('hidden');
      runDetails.classList.remove('hidden');
      
      // Set up auto-refresh for in-progress runs
      if (run.status === 'running' || run.status === 'pending') {
        if (!refreshInterval) {
          refreshInterval = setInterval(fetchRunDetails, 5000); // Refresh every 5 seconds
        }
      } else {
        clearInterval(refreshInterval);
      }
    } catch (error) {
      console.error('Error fetching run details:', error);
      alert('Error fetching run details: ' + error.message);
    }
  }
});