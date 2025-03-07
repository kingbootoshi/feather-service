// Create Pipeline JavaScript file for the Feather Agent Service UI

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Create Pipeline form initialized');
  
  // Get form elements
  const form = document.getElementById('create-pipeline-form');
  const cancelButton = document.getElementById('cancel-create');
  const addStepButton = document.getElementById('add-step');
  const addDestinationButton = document.getElementById('add-destination');
  const stepsContainer = document.getElementById('pipeline-steps-container');
  const destinationsContainer = document.getElementById('output-destinations-container');
  
  let stepCount = 0;
  let destinationCount = 0;
  
  // Add initial step
  addStep();
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    
    // Get steps
    const steps = [];
    document.querySelectorAll('.pipeline-step').forEach(stepElement => {
      const agentSelect = stepElement.querySelector('.agent-select');
      const inputMappingSelect = stepElement.querySelector('.input-mapping-select');
      
      if (agentSelect.value) {
        steps.push({
          agentId: agentSelect.value,
          inputMapping: inputMappingSelect.value
        });
      }
    });
    
    // Get output destinations
    const outputDestinations = [];
    document.querySelectorAll('.output-destination').forEach(destElement => {
      const typeSelect = destElement.querySelector('.destination-type-select');
      const targetInput = destElement.querySelector('.destination-target');
      
      if (typeSelect.value && targetInput.value) {
        outputDestinations.push({
          type: typeSelect.value,
          target: targetInput.value
        });
      }
    });
    
    // Validate
    if (steps.length === 0) {
      alert('Please add at least one step to the pipeline');
      return;
    }
    
    // Create pipeline data object
    const pipelineData = {
      name,
      description,
      steps,
      outputDestinations
    };
    
    try {
      // Check for authentication token
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Send the data to the API
      const response = await fetch('/api/pipelines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders() // Include authentication headers
        },
        body: JSON.stringify(pipelineData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create pipeline');
      }
      
      const result = await response.json();
      console.log('Pipeline created:', result);
      
      // Redirect to pipelines page
      window.location.href = '/pipelines';
    } catch (error) {
      console.error('Error creating pipeline:', error);
      alert('Error creating pipeline: ' + error.message);
    }
  });
  
  // Handle add step button
  addStepButton.addEventListener('click', () => {
    addStep();
  });
  
  // Handle add destination button
  addDestinationButton.addEventListener('click', () => {
    addDestination();
  });
  
  // Handle cancel button
  cancelButton.addEventListener('click', () => {
    window.location.href = '/pipelines';
  });
  
  // Function to add a step
  function addStep() {
    stepCount++;
    
    // Clone the step template
    const stepTemplate = document.getElementById('step-template');
    const stepElement = document.importNode(stepTemplate.content, true);
    
    // Update the step number
    stepElement.querySelector('.step-number').textContent = stepCount;
    
    // Add event listener to remove button
    stepElement.querySelector('.remove-step').addEventListener('click', function() {
      this.closest('.pipeline-step').remove();
      updateStepNumbers();
    });
    
    // Add the step to the container
    stepsContainer.appendChild(stepElement);
  }
  
  // Function to add a destination
  function addDestination() {
    destinationCount++;
    
    // Clone the destination template
    const destTemplate = document.getElementById('destination-template');
    const destElement = document.importNode(destTemplate.content, true);
    
    // Update the destination number
    destElement.querySelector('.destination-number').textContent = destinationCount;
    
    // Add event listener to remove button
    destElement.querySelector('.remove-destination').addEventListener('click', function() {
      this.closest('.output-destination').remove();
      updateDestinationNumbers();
    });
    
    // Add the destination to the container
    destinationsContainer.appendChild(destElement);
  }
  
  // Function to update step numbers
  function updateStepNumbers() {
    const steps = stepsContainer.querySelectorAll('.pipeline-step');
    steps.forEach((step, index) => {
      step.querySelector('.step-number').textContent = index + 1;
    });
    stepCount = steps.length;
  }
  
  // Function to update destination numbers
  function updateDestinationNumbers() {
    const destinations = destinationsContainer.querySelectorAll('.output-destination');
    destinations.forEach((dest, index) => {
      dest.querySelector('.destination-number').textContent = index + 1;
    });
    destinationCount = destinations.length;
  }
});