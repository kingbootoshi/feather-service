// Pipelines JavaScript file for the Feather Agent Service UI

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Pipelines page initialized');
  
  // Get elements
  const runButtons = document.querySelectorAll('.run-pipeline');
  const editButtons = document.querySelectorAll('.edit-pipeline');
  const deleteButtons = document.querySelectorAll('.delete-pipeline');
  const pipelineRunForm = document.getElementById('pipeline-run-form');
  const pipelineInput = document.getElementById('pipeline-input');
  const runPipelineSubmit = document.getElementById('run-pipeline-submit');
  const runPipelineCancel = document.getElementById('run-pipeline-cancel');
  const pipelineResult = document.getElementById('pipeline-result');
  const pipelineResultContent = document.getElementById('pipeline-result-content');
  const runsLink = document.getElementById('runs-link');
  
  let currentPipelineId = null;
  
  // Handle run pipeline button click
  runButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentPipelineId = button.getAttribute('data-id');
      pipelineRunForm.classList.remove('hidden');
      pipelineResult.classList.add('hidden');
      pipelineInput.value = '';
      pipelineInput.focus();
    });
  });
  
  // Handle run pipeline form submission
  runPipelineSubmit.addEventListener('click', async () => {
    if (!currentPipelineId) return;
    
    const input = pipelineInput.value.trim();
    if (!input) {
      alert('Please enter input for the pipeline');
      return;
    }
    
    try {
      runPipelineSubmit.disabled = true;
      runPipelineSubmit.textContent = 'Running...';
      
      // Send the request to run the pipeline
      const response = await fetch(`/api/pipelines/${currentPipelineId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run pipeline');
      }
      
      const result = await response.json();
      console.log('Pipeline run result:', result);
      
      // Display the result
      pipelineResult.classList.remove('hidden');
      pipelineResultContent.textContent = JSON.stringify(result, null, 2);
      
      // Update the runs link
      if (result.runId) {
        runsLink.href = `/runs/${result.runId}`;
      }
      
    } catch (error) {
      console.error('Error running pipeline:', error);
      alert('Error running pipeline: ' + error.message);
    } finally {
      runPipelineSubmit.disabled = false;
      runPipelineSubmit.textContent = 'Run';
    }
  });
  
  // Handle run form cancel button
  runPipelineCancel.addEventListener('click', () => {
    pipelineRunForm.classList.add('hidden');
    currentPipelineId = null;
  });
  
  // Handle edit pipeline button click
  editButtons.forEach(button => {
    button.addEventListener('click', () => {
      const pipelineId = button.getAttribute('data-id');
      window.location.href = `/pipelines/edit/${pipelineId}`;
    });
  });
  
  // Handle delete pipeline button click
  deleteButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const pipelineId = button.getAttribute('data-id');
      
      if (confirm('Are you sure you want to delete this pipeline?')) {
        try {
          const response = await fetch(`/api/pipelines/${pipelineId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete pipeline');
          }
          
          // Remove the pipeline card from the UI
          const pipelineCard = button.closest('.pipeline-card');
          pipelineCard.remove();
          
          // If no pipelines left, show the "no items" message
          const pipelinesList = document.querySelector('.pipelines-list');
          if (pipelinesList.children.length === 0) {
            const noItems = document.createElement('div');
            noItems.className = 'no-items';
            noItems.innerHTML = '<p>No pipelines found. <a href="/pipelines/new">Create your first pipeline</a>.</p>';
            pipelinesList.appendChild(noItems);
          }
        } catch (error) {
          console.error('Error deleting pipeline:', error);
          alert('Error deleting pipeline: ' + error.message);
        }
      }
    });
  });
});