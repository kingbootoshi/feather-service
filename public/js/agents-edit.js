// Agent Edit JavaScript for Feather Service UI

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('edit-agent-form');
  
  // Initialize form elements
  initializeForm();
  
  function initializeForm() {
    console.log('Initializing agent edit form for agent ID:', agentId);
    
    // Setup toggle for advanced fields
    const toggleAdvanced = document.getElementById('toggle-advanced');
    const advancedFields = document.getElementById('advanced-fields');
    
    // Always show advanced fields for editing
    if (advancedFields) {
      advancedFields.classList.remove('hidden');
      if (toggleAdvanced) {
        toggleAdvanced.textContent = 'Hide';
      }
    }
    
    // Determine the initial output type
    const tools = document.getElementById('tools');
    const structuredOutputSchema = document.getElementById('structuredOutputSchema');
    
    // Create the output type selector if it doesn't exist
    let outputTypeSelect = document.getElementById('outputType');
    if (!outputTypeSelect) {
      // Create a select element for output type
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';
      
      const label = document.createElement('label');
      label.setAttribute('for', 'outputType');
      label.textContent = 'Output Type';
      
      outputTypeSelect = document.createElement('select');
      outputTypeSelect.id = 'outputType';
      outputTypeSelect.name = 'outputType';
      
      // Add options
      const plainTextOption = document.createElement('option');
      plainTextOption.value = 'plain_text';
      plainTextOption.textContent = 'Plain Text';
      
      const functionCallsOption = document.createElement('option');
      functionCallsOption.value = 'function_calls';
      functionCallsOption.textContent = 'Function Calls';
      
      const structuredOption = document.createElement('option');
      structuredOption.value = 'structured';
      structuredOption.textContent = 'Structured';
      
      outputTypeSelect.appendChild(plainTextOption);
      outputTypeSelect.appendChild(functionCallsOption);
      outputTypeSelect.appendChild(structuredOption);
      
      formGroup.appendChild(label);
      formGroup.appendChild(outputTypeSelect);
      
      // Insert before the advanced section
      const advancedSection = document.querySelector('.advanced-section');
      if (advancedSection) {
        advancedSection.parentNode.insertBefore(formGroup, advancedSection);
      }
      
      // Set initial value based on existing configuration
      if (tools && tools.value && tools.value.trim() !== '[]') {
        outputTypeSelect.value = 'function_calls';
      } else if (structuredOutputSchema && structuredOutputSchema.value && structuredOutputSchema.value.trim() !== 'null') {
        outputTypeSelect.value = 'structured';
      } else {
        outputTypeSelect.value = 'plain_text';
      }
      
      // Add change event listener
      outputTypeSelect.addEventListener('change', updateOutputSections);
    }
    
    // Function to update visibility of output sections
    function updateOutputSections() {
      const outputType = outputTypeSelect.value;
      const toolsContainer = document.getElementById('tools').closest('.form-group');
      const schemaContainer = document.getElementById('structuredOutputSchema').closest('.form-group');
      
      // Update visibility based on output type
      if (toolsContainer) {
        toolsContainer.style.display = outputType === 'function_calls' ? 'block' : 'none';
      }
      
      if (schemaContainer) {
        schemaContainer.style.display = outputType === 'structured' ? 'block' : 'none';
      }
    }
    
    // Initialize sections visibility
    updateOutputSections();
    
    // If toggle exists, set up event listener
    if (toggleAdvanced && advancedFields) {
      toggleAdvanced.addEventListener('click', () => {
        advancedFields.classList.toggle('hidden');
        toggleAdvanced.textContent = advancedFields.classList.contains('hidden') ? 'Show' : 'Hide';
      });
    }
    
    // Submit handler
    form.addEventListener('submit', handleSubmit);
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Collect form data
    const updatedAgent = {
      name: document.getElementById('name').value,
      model: document.getElementById('model').value,
      systemPrompt: document.getElementById('systemPrompt').value,
      autoExecuteTools: document.getElementById('autoExecuteTools').checked,
      cognition: document.getElementById('cognition').checked,
      chainRun: document.getElementById('chainRun').checked,
      maxChainIterations: parseInt(document.getElementById('maxChainIterations').value, 10),
      forceTool: document.getElementById('forceTool').checked
    };
    
    // Get output type
    const outputType = document.getElementById('outputType');
    if (outputType) {
      // Clear tools and schema based on output type
      if (outputType.value === 'plain_text') {
        updatedAgent.tools = null;
        updatedAgent.structuredOutputSchema = null;
      }
    }
    
    // Parse JSON fields
    try {
      // Handle additionalParams as JSON
      const additionalParamsText = document.getElementById('additionalParams').value.trim();
      if (additionalParamsText) {
        updatedAgent.additionalParams = JSON.parse(additionalParamsText);
      }
      
      // Handle tools if function calls are selected
      const outputTypeValue = outputType ? outputType.value : null;
      
      if (outputTypeValue === 'function_calls' || !outputTypeValue) {
        const toolsText = document.getElementById('tools').value.trim();
        if (toolsText) {
          updatedAgent.tools = JSON.parse(toolsText);
        }
      }
      
      // Handle structuredOutputSchema if structured is selected
      if (outputTypeValue === 'structured' || !outputTypeValue) {
        const schemaText = document.getElementById('structuredOutputSchema').value.trim();
        if (schemaText && schemaText !== 'null') {
          updatedAgent.structuredOutputSchema = JSON.parse(schemaText);
        }
      }
    } catch (err) {
      alert(`Error parsing JSON: ${err.message}`);
      console.error('JSON parsing error:', err);
      return;
    }
    
    try {
      // Disable the submit button
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Saving...';
      
      // Send the update request
      console.log('Updating agent with data:', updatedAgent);
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedAgent)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update agent');
      }
      
      // Success - redirect to agents page
      window.location.href = '/agents';
    } catch (error) {
      console.error('Error updating agent:', error);
      alert('Error updating agent: ' + error.message);
      
      // Re-enable the submit button
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = 'Save Changes';
    }
  }
});