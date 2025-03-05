// Create Agent JavaScript file for the Feather Agent Service UI

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Create Agent form initialized');
  
  // Get form elements
  const form = document.getElementById('create-agent-form');
  const cancelButton = document.getElementById('cancel-create');
  const outputTypeSelect = document.getElementById('outputType');
  const toolsSection = document.getElementById('tools-section');
  const structuredOutputSection = document.getElementById('structured-output-section');
  const addToolButton = document.getElementById('add-tool');
  const toolsContainer = document.getElementById('tools-container');
  const toolTemplate = document.getElementById('tool-template');
  const cognitionCheckbox = document.getElementById('cognition');
  const structuredOutputCheckbox = document.getElementById('structuredOutput');
  
  // Counter for tool IDs
  let toolCounter = 0;
  
  // Initialize form
  initializeForm();
  
  // Initialize the form
  function initializeForm() {
    // Set up output type toggle
    outputTypeSelect.addEventListener('change', () => {
      const selectedType = outputTypeSelect.value;
      
      // Hide all output sections first
      toolsSection.classList.add('hidden');
      structuredOutputSection.classList.add('hidden');
      
      // Show the selected section
      if (selectedType === 'tools') {
        toolsSection.classList.remove('hidden');
        
        // Disable cognition if structured output is selected
        if (toolsContainer.children.length === 0) {
          addTool(); // Add a default tool if none exist
        }
      } else if (selectedType === 'structured') {
        structuredOutputSection.classList.remove('hidden');
      }
      
      // Update validation and dependency rules
      handleDependencies();
    });
    
    // Add tool button handler
    addToolButton.addEventListener('click', () => {
      addTool();
    });
    
    // Set up dependency handling
    cognitionCheckbox.addEventListener('change', handleDependencies);
    
    // Initial check for dependencies
    handleDependencies();
  }
  
  // Handle dependencies between form options
  function handleDependencies() {
    const outputType = outputTypeSelect.value;
    const cognitionEnabled = cognitionCheckbox.checked;
    
    // Cognition is incompatible with structured output
    if (outputType === 'structured') {
      cognitionCheckbox.disabled = true;
      cognitionCheckbox.checked = false;
    } else {
      cognitionCheckbox.disabled = false;
    }
    
    // Validate force tool option
    const forceToolCheckbox = document.getElementById('forceTool');
    const chainRunCheckbox = document.getElementById('chainRun');
    
    if (outputType === 'tools') {
      forceToolCheckbox.disabled = false;
      
      // Force tool requires exactly one tool
      if (forceToolCheckbox.checked) {
        // Can't have chain run with force tool
        chainRunCheckbox.disabled = true;
        chainRunCheckbox.checked = false;
        
        // Warn if more than one tool
        if (toolsContainer.children.length !== 1) {
          forceToolCheckbox.setCustomValidity('Force Tool requires exactly one tool.');
        } else {
          forceToolCheckbox.setCustomValidity('');
        }
      } else {
        chainRunCheckbox.disabled = false;
        forceToolCheckbox.setCustomValidity('');
      }
    } else {
      forceToolCheckbox.disabled = true;
      forceToolCheckbox.checked = false;
      chainRunCheckbox.disabled = false;
    }
  }
  
  // Add a new tool to the form
  function addTool() {
    // Clone the template
    const toolElement = document.importNode(toolTemplate.content, true).firstElementChild;
    toolCounter++;
    
    // Update IDs and labels with the current tool number
    toolElement.querySelectorAll('[id$="_IDX"]').forEach(el => {
      const newId = el.id.replace('_IDX', `_${toolCounter}`);
      el.id = newId;
      
      // Update any associated labels
      const label = toolElement.querySelector(`label[for="${el.id}"]`);
      if (label) {
        label.setAttribute('for', newId);
      }
    });
    
    // Set the tool number in the heading
    toolElement.querySelector('.tool-number').textContent = toolCounter;
    
    // Set up remove button
    const removeButton = toolElement.querySelector('.remove-tool');
    removeButton.addEventListener('click', () => {
      toolElement.remove();
      handleDependencies();
    });
    
    // Add the tool to the container
    toolsContainer.appendChild(toolElement);
    
    // Update dependencies
    handleDependencies();
  }
  
  // Serialize tools data from the form
  function serializeTools() {
    const tools = [];
    
    // Process each tool item in the container
    const toolItems = toolsContainer.querySelectorAll('.tool-item');
    toolItems.forEach(item => {
      try {
        const nameInput = item.querySelector('.tool-name');
        const descInput = item.querySelector('.tool-description');
        const paramsInput = item.querySelector('.tool-params');
        const implInput = item.querySelector('.tool-implementation');
        
        // Parse the parameters JSON
        let parametersJson;
        try {
          parametersJson = JSON.parse(paramsInput.value);
        } catch (e) {
          throw new Error(`Invalid JSON in tool parameters: ${e.message}`);
        }
        
        // Create the tool object
        const tool = {
          type: 'function',
          function: {
            name: nameInput.value,
            description: descInput.value,
            parameters: parametersJson
          },
          implementation: implInput.value
        };
        
        tools.push(tool);
      } catch (error) {
        console.error('Error serializing tool:', error);
        throw error;
      }
    });
    
    return tools;
  }
  
  // Parse structured output schema
  function parseStructuredOutputSchema() {
    const name = document.getElementById('structuredOutputName').value;
    const schema = document.getElementById('structuredOutputSchema').value;
    const strict = document.getElementById('strictSchema').checked;
    
    try {
      return {
        name: name || undefined,
        strict,
        schema: JSON.parse(schema)
      };
    } catch (e) {
      throw new Error(`Invalid JSON in structured output schema: ${e.message}`);
    }
  }
  
  // Parse additional parameters
  function parseAdditionalParams() {
    const params = document.getElementById('additionalParams').value.trim();
    
    if (!params) {
      return undefined;
    }
    
    try {
      return JSON.parse(params);
    } catch (e) {
      throw new Error(`Invalid JSON in additional parameters: ${e.message}`);
    }
  }
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Submitting agent form...');
    
    try {
      // Get form values
      const name = document.getElementById('name').value;
      const model = document.getElementById('model').value;
      const systemPrompt = document.getElementById('systemPrompt').value;
      const cognition = document.getElementById('cognition').checked;
      const chainRun = document.getElementById('chainRun').checked;
      const maxChainIterations = document.getElementById('maxChainIterations').value;
      const outputType = document.getElementById('outputType').value;
      
      // Create the base agent data object
      const agentData = {
        name,
        model,
        systemPrompt,
        cognition,
        chainRun,
        maxChainIterations: parseInt(maxChainIterations),
        additionalParams: parseAdditionalParams()
      };
      
      // Add output type-specific properties
      if (outputType === 'tools') {
        agentData.tools = serializeTools();
        agentData.autoExecuteTools = document.getElementById('autoExecuteTools').checked;
        agentData.forceTool = document.getElementById('forceTool').checked;
        
        // Validate force tool requires exactly one tool
        if (agentData.forceTool && agentData.tools.length !== 1) {
          throw new Error('Force Tool option requires exactly one tool.');
        }
      } else if (outputType === 'structured') {
        agentData.structuredOutputSchema = parseStructuredOutputSchema();
      }
      
      console.log('Agent data:', agentData);
      
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