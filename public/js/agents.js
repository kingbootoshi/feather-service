// Agents JavaScript file for the Feather Agent Service UI

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Agents page initialized');
  
  // Get elements
  const runButtons = document.querySelectorAll('.run-agent');
  const editButtons = document.querySelectorAll('.edit-agent');
  const deleteButtons = document.querySelectorAll('.delete-agent');
  const agentRunForm = document.getElementById('agent-run-form');
  const agentInput = document.getElementById('agent-input');
  const runAgentSubmit = document.getElementById('run-agent-submit');
  const runAgentCancel = document.getElementById('run-agent-cancel');
  const agentResult = document.getElementById('agent-result');
  const agentResultContent = document.getElementById('agent-result-content');
  
  let currentAgentId = null;
  
  // Handle run agent button click
  runButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentAgentId = button.getAttribute('data-id');
      agentRunForm.classList.remove('hidden');
      agentResult.classList.add('hidden');
      agentInput.value = '';
      agentInput.focus();
    });
  });
  
  // Handle run agent form submission
  runAgentSubmit.addEventListener('click', async () => {
    if (!currentAgentId) return;
    
    const input = agentInput.value.trim();
    if (!input) {
      alert('Please enter input for the agent');
      return;
    }
    
    try {
      runAgentSubmit.disabled = true;
      runAgentSubmit.textContent = 'Running...';
      
      // Send the request to run the agent
      const response = await fetch(`/api/agents/${currentAgentId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run agent');
      }
      
      const result = await response.json();
      console.log('Agent run result:', result);
      
      // Display the result
      agentResult.classList.remove('hidden');
      agentResultContent.textContent = result.output || 'No output';
      
    } catch (error) {
      console.error('Error running agent:', error);
      alert('Error running agent: ' + error.message);
    } finally {
      runAgentSubmit.disabled = false;
      runAgentSubmit.textContent = 'Run';
    }
  });
  
  // Handle run form cancel button
  runAgentCancel.addEventListener('click', () => {
    agentRunForm.classList.add('hidden');
    currentAgentId = null;
  });
  
  // Handle edit agent button click
  editButtons.forEach(button => {
    button.addEventListener('click', () => {
      const agentId = button.getAttribute('data-id');
      window.location.href = `/agents/edit/${agentId}`;
    });
  });
  
  // Handle delete agent button click
  deleteButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const agentId = button.getAttribute('data-id');
      
      if (confirm('Are you sure you want to delete this agent?')) {
        try {
          const response = await fetch(`/api/agents/${agentId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete agent');
          }
          
          // Remove the agent card from the UI
          const agentCard = button.closest('.agent-card');
          agentCard.remove();
          
          // If no agents left, show the "no items" message
          const agentsList = document.querySelector('.agents-list');
          if (agentsList.children.length === 0) {
            const noItems = document.createElement('div');
            noItems.className = 'no-items';
            noItems.innerHTML = '<p>No agents found. <a href="/agents/new">Create your first agent</a>.</p>';
            agentsList.appendChild(noItems);
          }
        } catch (error) {
          console.error('Error deleting agent:', error);
          alert('Error deleting agent: ' + error.message);
        }
      }
    });
  });
});