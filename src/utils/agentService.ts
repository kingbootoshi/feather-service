import { FeatherAgent } from 'feather-ai';
import { Agent, StandardAgentOutput } from '../models/types';

// Create a Feather Agent from our Agent model
export function createFeatherAgent(agent: Agent): FeatherAgent {
  console.log(`Creating Feather Agent for agent ID: ${agent.id}, model: ${agent.model}`);
  
  const config: any = {
    agentId: agent.id,
    model: agent.model,
    systemPrompt: agent.systemPrompt,
    tools: agent.tools || [],
    autoExecuteTools: agent.autoExecuteTools !== undefined ? agent.autoExecuteTools : true,
    cognition: agent.cognition || false,
    chainRun: agent.chainRun || false,
    maxChainIterations: agent.maxChainIterations || 5,
    forceTool: agent.forceTool || false,
    structuredOutputSchema: agent.structuredOutputSchema,
  };
  
  // Add any additional parameters
  if (agent.additionalParams) {
    console.log(`Adding additional parameters:`, agent.additionalParams);
    Object.assign(config, agent.additionalParams);
  }
  
  // Log if tools are configured
  if (agent.tools && agent.tools.length > 0) {
    console.log(`Configuring agent with ${agent.tools.length} tools`);
    agent.tools.forEach((tool, index) => {
      console.log(`Tool ${index + 1}: ${tool.function.name} - ${tool.function.description}`);
    });
  }
  
  // Log if structured output is configured
  if (agent.structuredOutputSchema) {
    console.log(`Configuring agent with structured output schema: ${agent.structuredOutputSchema.name || 'unnamed'}`);
    console.log(`Schema strict mode: ${agent.structuredOutputSchema.strict}`);
  }
  
  const featherAgent = new FeatherAgent(config);
  console.log(`Feather Agent created successfully for agent ID: ${agent.id}`);
  return featherAgent;
}

// Standardize agent output to ensure consistent handling regardless of output format
export function standardizeAgentOutput(result: any): StandardAgentOutput {
  console.log(`Standardizing agent output:`, JSON.stringify(result, null, 2));
  
  if (!result.success) {
    console.log(`Agent run was not successful, error: ${result.error || 'Unknown error'}`);
    return {
      success: false,
      output: '',
      error: result.error || 'Unknown error occurred',
    };
  }

  // Case 1: Manual function calls
  if (result.functionCalls && result.functionCalls.length > 0) {
    console.log(`Found ${result.functionCalls.length} manual function calls in the result`);
    
    // Return both the output (if present) and the function calls
    return {
      success: true,
      output: result.output || JSON.stringify(result.functionCalls),
      functionCalls: result.functionCalls.map((call: any) => ({
        functionName: call.functionName,
        functionArgs: call.functionArgs
      })),
    };
  }
  
  // Case 2: Structured output (JSON object rather than string)
  if (result.output && typeof result.output === 'object' && !Array.isArray(result.output)) {
    console.log(`Found structured output in the result`);
    return {
      success: true,
      output: result.output,
      structuredOutput: true
    };
  }

  // Case 3: Plain text output
  console.log(`Returning standard text output`);
  return {
    success: true,
    output: result.output,
  };
}

// Execute a single agent with input
export async function runAgent(agent: Agent, input: string): Promise<StandardAgentOutput> {
  console.log(`Running agent ${agent.id} (${agent.name}) with input: "${input.substring(0, 100)}${input.length > 100 ? '...' : ''}"`);
  
  try {
    console.log(`Creating Feather agent instance for ${agent.id}`);
    const featherAgent = createFeatherAgent(agent);
    
    console.log(`Executing agent run for ${agent.id}`);
    console.time(`Agent ${agent.id} execution time`);
    const result = await featherAgent.run(input);
    console.timeEnd(`Agent ${agent.id} execution time`);
    
    console.log(`Agent ${agent.id} execution completed successfully`);
    
    // Get standardized output
    const standardOutput = standardizeAgentOutput(result);
    
    // Log output details
    if (standardOutput.success) {
      if (standardOutput.functionCalls) {
        console.log(`Agent ${agent.id} returned function calls:`, standardOutput.functionCalls);
      }
      if (standardOutput.structuredOutput) {
        console.log(`Agent ${agent.id} returned structured output:`, 
          typeof standardOutput.output === 'object' ? 
            JSON.stringify(standardOutput.output, null, 2).substring(0, 500) : 
            'Invalid structured output');
      } else {
        console.log(`Agent ${agent.id} returned plain text output:`, 
          typeof standardOutput.output === 'string' ? 
            standardOutput.output.substring(0, 200) + (standardOutput.output.length > 200 ? '...' : '') : 
            JSON.stringify(standardOutput.output).substring(0, 200));
      }
    } else {
      console.error(`Agent ${agent.id} execution failed with error:`, standardOutput.error);
    }
    
    return standardOutput;
  } catch (error) {
    console.error(`Error running agent ${agent.id}:`, error);
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}