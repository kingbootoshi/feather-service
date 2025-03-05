// Create Agent JavaScript file for the Feather Agent Service UI

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Create Agent form initialized');
  
  // Get form elements
  const form = document.getElementById('create-agent-form');
  const cancelButton = document.getElementById('cancel-create');
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const model = document.getElementById('model').value;
    const systemPrompt = document.getElementById('systemPrompt').value;
    const cognition = document.getElementById('cognition').checked;
    const chainRun = document.getElementById('chainRun').checked;
    const maxChainIterations = document.getElementById('maxChainIterations').value;
    const autoExecuteTools = document.getElementById('autoExecuteTools').checked;
    const forceTool = document.getElementById('forceTool').checked;
    
    // Create agent data object
    const agentData = {
      name,
      model,
      systemPrompt,
      cognition,
      chainRun,
      maxChainIterations: parseInt(maxChainIterations),
      autoExecuteTools,
      forceTool
    };
    
    try {
      // Send the data to the API
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agentData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create agent');
      }
      
      const result = await response.json();
      console.log('Agent created:', result);
      
      // Redirect to agents page
      window.location.href = '/agents';
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Error creating agent: ' + error.message);
    }
  });
  
  // Handle cancel button
  cancelButton.addEventListener('click', () => {
    window.location.href = '/agents';
  });
});