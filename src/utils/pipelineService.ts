import { Pipeline, Run, StandardAgentOutput } from '../models/types';
import { getAgentById } from '../db/database';
import { runAgent } from './agentService';
import { createRun, updateRun } from '../db/database';

// Extract the input for the next agent based on the inputMapping configuration
function extractInput(output: any, inputMapping?: string): string {
  if (!inputMapping || inputMapping === 'direct') {
    // Direct use of previous output
    return typeof output === 'string' ? output : JSON.stringify(output);
  }

  if (inputMapping.startsWith('field.')) {
    // Extract a specific field from previous output
    const fieldName = inputMapping.substring(6); // Remove 'field.' prefix
    const outputObj = typeof output === 'string' ? JSON.parse(output) : output;
    
    if (outputObj && outputObj[fieldName] !== undefined) {
      return typeof outputObj[fieldName] === 'string' 
        ? outputObj[fieldName] 
        : JSON.stringify(outputObj[fieldName]);
    }
  }

  // Default fallback
  return typeof output === 'string' ? output : JSON.stringify(output);
}

// Execute a pipeline of agents
export async function runPipeline(pipeline: Pipeline, initialInput: string): Promise<Run> {
  // Create a new run record
  const run: Run = createRun({
    pipelineId: pipeline.id,
    input: initialInput,
    outputs: [],
    status: 'running',
  });

  try {
    let currentInput = initialInput;
    let finalOutput: any = null;

    // Execute each step in the pipeline
    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      const agent = getAgentById(step.agentId);

      if (!agent) {
        throw new Error(`Agent with ID ${step.agentId} not found for pipeline step ${i+1}`);
      }

      // Run the agent with the current input
      const result = await runAgent(agent, currentInput);
      
      // Add the output to the run record
      run.outputs.push({
        agentId: agent.id,
        output: result.output,
        timestamp: new Date()
      });

      // Update the run record in the database
      updateRun(run.id, {
        outputs: run.outputs
      });

      // Set the input for the next agent
      if (i < pipeline.steps.length - 1) {
        currentInput = extractInput(result.output, pipeline.steps[i+1].inputMapping);
      }

      // Save the final output
      if (i === pipeline.steps.length - 1) {
        finalOutput = result.output;
      }

      // If the agent execution failed, break the pipeline
      if (!result.success) {
        throw new Error(result.error || `Failed at step ${i+1}`);
      }
    }

    // Update the run record with the final status and output
    return updateRun(run.id, {
      status: 'completed',
      finalOutput,
      completedAt: new Date()
    }) as Run;
  } catch (error) {
    // Update the run record with the error
    return updateRun(run.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      completedAt: new Date()
    }) as Run;
  }
}