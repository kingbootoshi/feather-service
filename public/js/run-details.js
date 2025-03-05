// Run Details JavaScript file for the Feather Agent Service UI

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Run Details page initialized');
  
  // Get elements
  const runLoading = document.getElementById('run-loading');
  const runDetails = document.getElementById('run-details');
  const runNotFound = document.getElementById('run-not-found');
  const runIdEl = document.getElementById('run-id');
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
  
  // Format the output based on its type
  function formatOutput(output) {
    if (output === undefined || output === null) {
      return 'No output available';
    }
    
    try {
      if (typeof output === 'string') {
        // Check if it's a JSON string
        if (output.trim().startsWith('{') || output.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(output);
            return JSON.stringify(parsed, null, 2);
          } catch {
            // Not valid JSON, just a string
            return output;
          }
        }
        return output;
      } else {
        // Object or other type
        return JSON.stringify(output, null, 2);
      }
    } catch (error) {
      console.error('Error formatting output:', error);
      return 'Error formatting output: ' + error.message;
    }
  }
  
  // Create a function call display
  function createFunctionCallDisplay(functionCall) {
    const container = document.createElement('div');
    container.className = 'function-call';
    
    // Format function args for display
    let formattedArgs;
    try {
      if (typeof functionCall.functionArgs === 'string') {
        // Try to parse JSON string args
        try {
          const parsedArgs = JSON.parse(functionCall.functionArgs);
          formattedArgs = JSON.stringify(parsedArgs, null, 2);
        } catch {
          formattedArgs = functionCall.functionArgs;
        }
      } else {
        formattedArgs = JSON.stringify(functionCall.functionArgs, null, 2);
      }
    } catch (error) {
      formattedArgs = 'Error formatting arguments: ' + error.message;
    }
    
    container.innerHTML = `
      <h6>Function Call: <code>${functionCall.functionName}</code></h6>
      <div class="function-args">
        <h6>Arguments:</h6>
        <pre>${formattedArgs}</pre>
      </div>
    `;
    
    return container;
  }
  
  // Format agent output based on its type
  function formatAgentOutput(output, meta) {
    // Create container for the output
    const container = document.createElement('div');
    container.className = 'agent-output';
    
    // Handle different output types
    if (meta && meta.functionCalls && meta.functionCalls.length > 0) {
      // Function calls
      const functionCallsEl = document.createElement('div');
      functionCallsEl.className = 'function-calls';
      
      const header = document.createElement('h6');
      header.innerText = 'Function Calls:';
      functionCallsEl.appendChild(header);
      
      meta.functionCalls.forEach(call => {
        functionCallsEl.appendChild(createFunctionCallDisplay(call));
      });
      
      container.appendChild(functionCallsEl);
      
      // Add text output if present
      if (output) {
        const textOutput = document.createElement('div');
        textOutput.className = 'text-output';
        
        const textHeader = document.createElement('h6');
        textHeader.innerText = 'Text Output:';
        textOutput.appendChild(textHeader);
        
        const pre = document.createElement('pre');
        pre.innerText = formatOutput(output);
        textOutput.appendChild(pre);
        
        container.appendChild(textOutput);
      }
    } else if (meta && meta.structuredOutput) {
      // Structured output
      const header = document.createElement('h6');
      header.innerText = 'Structured Output:';
      
      const pre = document.createElement('pre');
      pre.className = 'structured-output';
      pre.innerText = formatOutput(output);
      
      container.appendChild(header);
      container.appendChild(pre);
    } else {
      // Standard text output
      const pre = document.createElement('pre');
      pre.innerText = formatOutput(output);
      container.appendChild(pre);
    }
    
    return container;
  }
  
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
      
      // Get agent names for reference
      const agentsResponse = await fetch('/api/agents');
      const agents = await agentsResponse.json();
      const agentMap = {};
      agents.forEach(agent => {
        agentMap[agent.id] = agent.name;
      });
      
      // Update the UI with the run details
      runIdEl.textContent = run.id;
      runType.textContent = run.pipelineId ? 'Pipeline' : 'Agent';
      
      // Add status with badge
      const statusBadge = document.createElement('span');
      statusBadge.className = `status-badge ${run.status}`;
      statusBadge.textContent = run.status;
      runStatus.innerHTML = '';
      runStatus.appendChild(statusBadge);
      
      // Dates
      runCreated.textContent = new Date(run.createdAt).toLocaleString();
      runCompleted.textContent = run.completedAt ? new Date(run.completedAt).toLocaleString() : 'Not completed';
      
      // Input
      runInputContent.textContent = run.input;
      
      // Steps/Outputs
      runStepsContainer.innerHTML = '';
      
      // Check if there are any outputs
      if (run.outputs && run.outputs.length > 0) {
        run.outputs.forEach((output, index) => {
          // Create step output container
          const stepOutput = document.createElement('div');
          stepOutput.className = 'step-output';
          
          // Create step header
          const stepHeader = document.createElement('h5');
          const agentName = agentMap[output.agentId] || output.agentId;
          stepHeader.innerHTML = `Step ${index + 1}: ${agentName} <span class="agent-id">(${output.agentId})</span>`;
          
          // Create timestamp
          const timestamp = document.createElement('p');
          timestamp.innerHTML = `<strong>Time:</strong> ${new Date(output.timestamp).toLocaleString()}`;
          
          // Add output content
          stepOutput.appendChild(stepHeader);
          stepOutput.appendChild(timestamp);
          
          // Add output
          const outputContainer = formatAgentOutput(output.output, output.meta);
          stepOutput.appendChild(outputContainer);
          
          // Add to container
          runStepsContainer.appendChild(stepOutput);
        });
      } else {
        // No outputs yet
        const noSteps = document.createElement('p');
        noSteps.className = 'no-steps';
        noSteps.textContent = 'No steps have been executed yet.';
        runStepsContainer.appendChild(noSteps);
      }
      
      // Final output
      if (run.finalOutput) {
        const outputContainer = formatAgentOutput(run.finalOutput, run.finalOutputMeta);
        runOutputContent.innerHTML = '';
        runOutputContent.appendChild(outputContainer);
      } else {
        runOutputContent.innerHTML = '<p>No final output available yet</p>';
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