import { FeatherAgent } from 'feather-ai';
import { Agent, StandardAgentOutput } from '../models/types';

// Create a Feather Agent from our Agent model
export function createFeatherAgent(agent: Agent): FeatherAgent {
  const featherAgent = new FeatherAgent({
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
  });

  return featherAgent;
}

// Standardize agent output to ensure consistent handling regardless of output format
export function standardizeAgentOutput(result: any): StandardAgentOutput {
  if (!result.success) {
    return {
      success: false,
      output: '',
      error: result.error || 'Unknown error occurred',
    };
  }

  if (result.functionCalls && result.functionCalls.length > 0) {
    // For manual function calls, pass them along
    return {
      success: true,
      output: result.output || JSON.stringify(result.functionCalls),
      functionCalls: result.functionCalls,
    };
  }

  // Handle normal output and structured output
  return {
    success: true,
    output: result.output,
  };
}

// Execute a single agent with input
export async function runAgent(agent: Agent, input: string): Promise<StandardAgentOutput> {
  try {
    const featherAgent = createFeatherAgent(agent);
    const result = await featherAgent.run(input);
    return standardizeAgentOutput(result);
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}