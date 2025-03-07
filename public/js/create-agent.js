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
  const schemaPropertyTemplate = document.getElementById('schema-property-template');
  const toolParameterTemplate = document.getElementById('tool-parameter-template');
  const cognitionCheckbox = document.getElementById('cognition');
  const addSchemaPropertyButton = document.getElementById('add-schema-property');
  const schemaPropertiesContainer = document.getElementById('schema-properties-container');
  
  // Counters for IDs
  let toolCounter = 0;
  let propertyCounter = 0;
  let parameterCounter = 0;
  
  // Store Monaco editors
  const monacoEditors = {};
  
  // Initialize Monaco editor
  require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@latest/min/vs' }});
  
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
        
        // Add a default tool if none exist
        if (toolsContainer.children.length === 0) {
          addTool();
        }
      } else if (selectedType === 'structured') {
        structuredOutputSection.classList.remove('hidden');
        
        // Add a default property if none exist
        if (schemaPropertiesContainer.children.length === 0) {
          addSchemaProperty();
        }
        
        // Update the schema preview
        updateSchemaPreview();
      }
      
      // Update validation and dependency rules
      handleDependencies();
    });
    
    // Add tool button handler
    addToolButton.addEventListener('click', () => {
      addTool();
    });
    
    // Add schema property button handler
    addSchemaPropertyButton.addEventListener('click', () => {
      addSchemaProperty();
    });
    
    // Set up schema preview generator
    document.getElementById('strictSchema').addEventListener('change', updateSchemaPreview);
    document.getElementById('structuredOutputName').addEventListener('input', updateSchemaPreview);
    
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
      // Clean up the Monaco editor
      if (monacoEditors[`tool_${toolCounter}`]) {
        monacoEditors[`tool_${toolCounter}`].dispose();
        delete monacoEditors[`tool_${toolCounter}`];
      }
      
      toolElement.remove();
      handleDependencies();
    });
    
    // Set up parameter builder
    const parametersBuilder = toolElement.querySelector(`#toolParametersBuilder_${toolCounter}`);
    const addParameterButton = parametersBuilder.querySelector('.add-parameter');
    const parametersList = parametersBuilder.querySelector('.tool-parameters-list');
    const paramsInput = toolElement.querySelector(`#toolParams_${toolCounter}`);
    
    addParameterButton.addEventListener('click', () => {
      addToolParameter(parametersList, toolCounter);
      updateParametersJson(parametersList, paramsInput);
    });
    
    // Initialize with one parameter
    addToolParameter(parametersList, toolCounter);
    
    // Set up Monaco editor
    initializeMonacoEditor(toolCounter);
    
    // Set up test button
    const testButton = toolElement.querySelector(`#testTool_${toolCounter}`);
    testButton.addEventListener('click', () => {
      testToolImplementation(toolCounter);
    });
    
    // Add the tool to the container
    toolsContainer.appendChild(toolElement);
    
    // Update dependencies
    handleDependencies();
  }
  
  // Initialize Monaco editor for a tool
  function initializeMonacoEditor(toolIndex) {
    require(['vs/editor/editor.main'], function() {
      const editorContainer = document.getElementById(`monaco-editor-container_${toolIndex}`);
      const editorInput = document.getElementById(`toolImplementation_${toolIndex}`);
      
      // Default code template
      const defaultCode = `async function execute(args) {
  // Your implementation here
  console.log("Executing with args:", args);
  
  // Return the result
  return { 
    result: \`Hello \${args.name || 'world'}\` 
  };
}`;
      
      // Create the editor
      const editor = monaco.editor.create(editorContainer, {
        value: defaultCode,
        language: 'typescript',
        theme: 'vs-dark',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true
      });
      
      // Save the editor instance
      monacoEditors[`tool_${toolIndex}`] = editor;
      
      // Update the hidden input on change
      editor.onDidChangeModelContent(() => {
        editorInput.value = editor.getValue();
      });
      
      // Set initial value
      editorInput.value = defaultCode;
    });
  }
  
  // Add a parameter to a tool
  function addToolParameter(parametersList, toolIndex) {
    // Clone the parameter template
    const paramElement = document.importNode(toolParameterTemplate.content, true).firstElementChild;
    parameterCounter++;
    
    // Update IDs and labels
    paramElement.querySelectorAll('[id$="_IDX"]').forEach(el => {
      const newId = el.id.replace('_IDX', `_${toolIndex}_${parameterCounter}`);
      el.id = newId;
      
      // Update any associated labels
      const label = paramElement.querySelector(`label[for="${el.id}"]`);
      if (label) {
        label.setAttribute('for', newId);
      }
    });
    
    // Set up remove button
    const removeButton = paramElement.querySelector('.remove-parameter');
    removeButton.addEventListener('click', () => {
      paramElement.remove();
      updateParametersJson(parametersList, document.getElementById(`toolParams_${toolIndex}`));
      updateTestArguments(toolIndex);
    });
    
    // Set up change event listeners for all inputs
    paramElement.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', () => {
        updateParametersJson(parametersList, document.getElementById(`toolParams_${toolIndex}`));
        updateTestArguments(toolIndex);
      });
      input.addEventListener('input', () => {
        updateParametersJson(parametersList, document.getElementById(`toolParams_${toolIndex}`));
        updateTestArguments(toolIndex);
      });
    });
    
    // Add the parameter to the list
    parametersList.appendChild(paramElement);
    
    // Update the JSON input and test arguments
    updateParametersJson(parametersList, document.getElementById(`toolParams_${toolIndex}`));
    updateTestArguments(toolIndex);
  }
  
  // Update the JSON parameters based on the form inputs
  function updateParametersJson(parametersList, hiddenInput) {
    const parameters = {
      type: 'object',
      properties: {},
      required: []
    };
    
    // Process each parameter
    parametersList.querySelectorAll('.tool-parameter').forEach(param => {
      const nameInput = param.querySelector('.param-name');
      const typeInput = param.querySelector('.param-type');
      const descInput = param.querySelector('.param-description');
      const requiredInput = param.querySelector('.param-required');
      
      if (nameInput && nameInput.value) {
        // Add to properties
        parameters.properties[nameInput.value] = {
          type: typeInput.value,
          description: descInput.value || `Parameter ${nameInput.value}`
        };
        
        // Add to required list if checked
        if (requiredInput.checked) {
          parameters.required.push(nameInput.value);
        }
      }
    });
    
    // Set the hidden input value
    hiddenInput.value = JSON.stringify(parameters, null, 2);
  }
  
  // Update test arguments form for a tool
  function updateTestArguments(toolIndex) {
    const testArgsContainer = document.getElementById(`testArgsContainer_${toolIndex}`);
    const paramsInput = document.getElementById(`toolParams_${toolIndex}`);
    let params;
    
    try {
      params = JSON.parse(paramsInput.value);
    } catch (e) {
      console.error('Error parsing parameters:', e);
      return;
    }
    
    // Clear existing test inputs
    testArgsContainer.innerHTML = '';
    
    // Create a form for each parameter
    for (const paramName in params.properties) {
      const param = params.properties[paramName];
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';
      
      const label = document.createElement('label');
      label.textContent = `${paramName}${params.required?.includes(paramName) ? '*' : ''}:`;
      label.setAttribute('for', `test_${toolIndex}_${paramName}`);
      
      let input;
      
      // Create appropriate input based on type
      switch (param.type) {
        case 'boolean':
          input = document.createElement('select');
          input.innerHTML = `
            <option value="true">true</option>
            <option value="false">false</option>
          `;
          break;
        case 'number':
          input = document.createElement('input');
          input.type = 'number';
          input.step = 'any';
          break;
        default:
          input = document.createElement('input');
          input.type = 'text';
      }
      
      input.id = `test_${toolIndex}_${paramName}`;
      input.className = 'test-arg-input';
      input.setAttribute('data-param-name', paramName);
      input.setAttribute('data-param-type', param.type);
      
      // Add placeholder from description
      if (param.description) {
        input.placeholder = param.description;
      }
      
      // Make required if in required array
      if (params.required?.includes(paramName)) {
        input.required = true;
      }
      
      formGroup.appendChild(label);
      formGroup.appendChild(input);
      testArgsContainer.appendChild(formGroup);
    }
  }
  
  // Test a tool implementation
  async function testToolImplementation(toolIndex) {
    const testResult = document.getElementById(`testResult_${toolIndex}`);
    testResult.textContent = 'Testing...';
    
    try {
      // Get the code
      const code = monacoEditors[`tool_${toolIndex}`].getValue();
      
      // Collect args from test inputs
      const args = {};
      const testInputs = document.querySelectorAll(`#testArgsContainer_${toolIndex} .test-arg-input`);
      
      testInputs.forEach(input => {
        const paramName = input.getAttribute('data-param-name');
        const paramType = input.getAttribute('data-param-type');
        let value = input.value;
        
        // Type conversions
        if (paramType === 'number') {
          value = Number(value);
        } else if (paramType === 'boolean') {
          value = value === 'true';
        }
        
        args[paramName] = value;
      });
      
      // Send to the API for testing
      const response = await fetch('/api/agents/test-function', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code, args })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Function test failed');
      }
      
      // Display result
      const result = await response.json();
      testResult.textContent = JSON.stringify(result, null, 2);
      testResult.classList.remove('error');
    } catch (error) {
      console.error('Error testing function:', error);
      testResult.textContent = `Error: ${error.message}`;
      testResult.classList.add('error');
    }
  }
  
  // Add a new schema property
  function addSchemaProperty(container = null, level = 0) {
    // Default to top level if no container is provided
    const propertiesContainer = container || schemaPropertiesContainer;
    
    // Clone the template
    const propertyElement = document.importNode(schemaPropertyTemplate.content, true).firstElementChild;
    propertyCounter++;
    
    // Update IDs and labels with the current property number
    propertyElement.querySelectorAll('[id$="_IDX"]').forEach(el => {
      const newId = el.id.replace('_IDX', `_${propertyCounter}`);
      el.id = newId;
      
      // Update any associated labels
      const label = propertyElement.querySelector(`label[for="${el.id}"]`);
      if (label) {
        label.setAttribute('for', newId);
      }
    });
    
    // Set up type change handler to show/hide nested properties
    const typeSelect = propertyElement.querySelector('.prop-type');
    const nestedContainer = propertyElement.querySelector(`#nestedProps_${propertyCounter}`);
    
    typeSelect.addEventListener('change', () => {
      if (typeSelect.value === 'object' || typeSelect.value === 'array') {
        nestedContainer.classList.remove('hidden');
      } else {
        nestedContainer.classList.add('hidden');
      }
      updateSchemaPreview();
    });
    
    // Set up add nested property button
    const addNestedButton = propertyElement.querySelector('.add-nested-property');
    const nestedPropertiesContainer = propertyElement.querySelector('.nested-properties-container');
    
    addNestedButton.addEventListener('click', () => {
      addSchemaProperty(nestedPropertiesContainer, level + 1);
    });
    
    // Set up remove button
    const removeButton = propertyElement.querySelector('.remove-property');
    removeButton.addEventListener('click', () => {
      propertyElement.remove();
      updateSchemaPreview();
    });
    
    // Set up change event listeners for all inputs
    propertyElement.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', updateSchemaPreview);
      input.addEventListener('input', updateSchemaPreview);
    });
    
    // Add the property to the container
    propertiesContainer.appendChild(propertyElement);
    
    // Update the schema preview
    updateSchemaPreview();
  }
  
  // Update schema preview based on the form inputs
  function updateSchemaPreview() {
    const schema = buildSchemaFromForm();
    const strictSchema = document.getElementById('strictSchema').checked;
    const schemaName = document.getElementById('structuredOutputName').value;
    
    // Create the complete schema object
    const completeSchema = {
      name: schemaName || undefined,
      strict: strictSchema,
      schema: schema
    };
    
    // Update the preview
    const preview = document.getElementById('structuredOutputPreview');
    preview.textContent = JSON.stringify(completeSchema, null, 2);
    
    // Update the hidden input
    document.getElementById('structuredOutputSchema').value = JSON.stringify(schema);
  }
  
  // Build a schema object from the form inputs
  function buildSchemaFromForm(container = null) {
    // Default to top level if no container is provided
    const propertiesContainer = container || schemaPropertiesContainer;
    
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };
    
    // Process each property in the container
    propertiesContainer.querySelectorAll(':scope > .schema-property').forEach(prop => {
      const nameInput = prop.querySelector('.prop-name');
      const typeInput = prop.querySelector('.prop-type');
      const descInput = prop.querySelector('.prop-description');
      const requiredInput = prop.querySelector('.prop-required');
      
      if (nameInput && nameInput.value) {
        const propertyId = nameInput.id.split('_')[1];
        const nestedContainer = prop.querySelector(`.nested-properties-container`);
        
        // Create property object
        const property = {
          type: typeInput.value,
          description: descInput.value || undefined
        };
        
        // Handle nested properties for objects and arrays
        if (typeInput.value === 'object' && nestedContainer.children.length > 0) {
          Object.assign(property, buildSchemaFromForm(nestedContainer));
        } else if (typeInput.value === 'array' && nestedContainer.children.length > 0) {
          // For arrays, we'll assume items are objects with the same schema
          property.items = buildSchemaFromForm(nestedContainer);
        }
        
        // Add to properties
        schema.properties[nameInput.value] = property;
        
        // Add to required list if checked
        if (requiredInput.checked) {
          schema.required.push(nameInput.value);
        }
      }
    });
    
    // Remove required array if empty
    if (schema.required.length === 0) {
      delete schema.required;
    }
    
    return schema;
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
        
        // Get the tool number to find the associated editor
        const toolNumber = nameInput.id.split('_')[1];
        const editor = monacoEditors[`tool_${toolNumber}`];
        
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
          implementation: editor.getValue()
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
        headers: getAuthHeaders(),
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