import { Pipeline, Run, StandardAgentOutput } from '../models/types';
import { getAgentById } from '../db/database';
import { runAgent } from './agentService';
import { createRun, updateRun } from '../db/database';

// Extract the input for the next agent based on the inputMapping configuration
function extractInput(output: any, inputMapping?: string): string {
  console.log(`Extracting input using mapping: ${inputMapping || 'direct'}`);
  console.log(`Output type: ${typeof output}`);
  
  if (typeof output === 'object') {
    console.log(`Output object keys: ${Object.keys(output).join(', ')}`);
  }

  // Extract based on mapping type
  if (!inputMapping || inputMapping === 'direct') {
    // Direct use of previous output
    console.log('Using direct output mapping');
    if (typeof output === 'string') {
      return output;
    } else {
      const serialized = JSON.stringify(output);
      console.log(`Serialized object output: ${serialized.substring(0, 100)}${serialized.length > 100 ? '...' : ''}`);
      return serialized;
    }
  }

  if (inputMapping.startsWith('field.')) {
    // Extract a specific field from previous output
    const fieldName = inputMapping.substring(6); // Remove 'field.' prefix
    console.log(`Extracting field: ${fieldName} from output`);
    
    // Parse if string, otherwise use as-is
    const outputObj = typeof output === 'string' ? JSON.parse(output) : output;
    
    if (outputObj && outputObj[fieldName] !== undefined) {
      console.log(`Field ${fieldName} found in output`);
      
      if (typeof outputObj[fieldName] === 'string') {
        return outputObj[fieldName];
      } else {
        const serialized = JSON.stringify(outputObj[fieldName]);
        console.log(`Serialized field output: ${serialized.substring(0, 100)}${serialized.length > 100 ? '...' : ''}`);
        return serialized;
      }
    } else {
      console.warn(`Field ${fieldName} not found in output, falling back to full output`);
    }
  }

  // Default fallback
  console.log('Using default fallback for output mapping');
  return typeof output === 'string' ? output : JSON.stringify(output);
}

// Execute a pipeline of agents
export async function runPipeline(pipeline: Pipeline, initialInput: string): Promise<Run> {
  console.log(`Starting pipeline execution for ${pipeline.id} (${pipeline.name})`);
  console.log(`Pipeline has ${pipeline.steps.length} steps`);
  console.log(`Initial input: "${initialInput.substring(0, 100)}${initialInput.length > 100 ? '...' : ''}"`);
  
  // Create a new run record
  const run: Run = createRun({
    pipelineId: pipeline.id,
    input: initialInput,
    outputs: [],
    status: 'running',
  });
  
  console.log(`Created run record with ID: ${run.id}`);

  try {
    let currentInput = initialInput;
    let finalOutput: any = null;
    const stepResults: Array<{step: number, agent: string, result: StandardAgentOutput}> = [];

    // Execute each step in the pipeline
    for (let i = 0; i < pipeline.steps.length; i++) {
      console.log(`\n--- Executing Pipeline Step ${i + 1}/${pipeline.steps.length} ---`);
      
      const step = pipeline.steps[i];
      const agent = getAgentById(step.agentId);

      if (!agent) {
        console.error(`Agent with ID ${step.agentId} not found for pipeline step ${i+1}`);
        throw new Error(`Agent with ID ${step.agentId} not found for pipeline step ${i+1}`);
      }

      console.log(`Running agent: ${agent.name} (${agent.id})`);
      console.log(`Step input: "${currentInput.substring(0, 100)}${currentInput.length > 100 ? '...' : ''}"`);
      
      // Time the step execution
      console.time(`Pipeline step ${i+1} execution time`);
      
      // Run the agent with the current input
      const result = await runAgent(agent, currentInput);
      
      console.timeEnd(`Pipeline step ${i+1} execution time`);
      console.log(`Step ${i+1} completed with success: ${result.success}`);
      
      // Store the step result
      stepResults.push({
        step: i + 1,
        agent: agent.name,
        result
      });
      
      // Log the step outcome
      if (result.success) {
        if (result.functionCalls) {
          console.log(`Step ${i+1} produced function calls:`, result.functionCalls);
        }
        if (result.structuredOutput) {
          console.log(`Step ${i+1} produced structured output`);
        } else {
          console.log(`Step ${i+1} output: "${typeof result.output === 'string' ? 
            result.output.substring(0, 100) + (result.output.length > 100 ? '...' : '') : 
            JSON.stringify(result.output).substring(0, 100)}"`);
        }
      } else {
        console.error(`Step ${i+1} failed with error: ${result.error}`);
      }
      
      // Add the output to the run record with metadata
      run.outputs.push({
        agentId: agent.id,
        output: result.output,
        timestamp: new Date(),
        meta: {
          functionCalls: result.functionCalls,
          structuredOutput: result.structuredOutput
        }
      });

      // Update the run record in the database
      console.log(`Updating run record with step ${i+1} output`);
      updateRun(run.id, {
        outputs: run.outputs
      });

      // If the agent execution failed, break the pipeline
      if (!result.success) {
        console.error(`Pipeline execution stopped due to failure at step ${i+1}`);
        throw new Error(result.error || `Failed at step ${i+1}`);
      }

      // Set the input for the next agent if this isn't the last step
      if (i < pipeline.steps.length - 1) {
        console.log(`Preparing input for next step (${i+2})`);
        currentInput = extractInput(result.output, pipeline.steps[i+1].inputMapping);
        console.log(`Next step input prepared: "${currentInput.substring(0, 100)}${currentInput.length > 100 ? '...' : ''}"`);
      }

      // Save the final output if this is the last step
      if (i === pipeline.steps.length - 1) {
        console.log(`Saving final output from last step`);
        finalOutput = result.output;
      }
    }

    // Generate a summary of the pipeline execution
    console.log(`\n=== Pipeline Execution Summary ===`);
    console.log(`Pipeline: ${pipeline.name} (${pipeline.id})`);
    console.log(`Status: Completed successfully`);
    console.log(`Steps executed: ${stepResults.length}/${pipeline.steps.length}`);
    
    stepResults.forEach(({step, agent, result}) => {
      console.log(`Step ${step} (${agent}): ${result.success ? 'Success' : 'Failed'}`);
    });
    
    // If there are output destinations configured, log them
    if (pipeline.outputDestinations && pipeline.outputDestinations.length > 0) {
      console.log(`\nOutput destinations (${pipeline.outputDestinations.length}):`);
      pipeline.outputDestinations.forEach((dest, i) => {
        console.log(`Destination ${i+1}: ${dest.type} - ${dest.target}`);
      });
      // Here you would implement the actual output distribution
    }

    // Find the last result to get its metadata
    const lastResult = stepResults.length > 0 ? stepResults[stepResults.length - 1].result : null;
    
    // Update the run record with the final status, output, and metadata
    console.log(`Finalizing run record with status: completed`);
    return updateRun(run.id, {
      status: 'completed',
      finalOutput,
      finalOutputMeta: lastResult ? {
        functionCalls: lastResult.functionCalls,
        structuredOutput: lastResult.structuredOutput
      } : undefined,
      completedAt: new Date()
    }) as Run;
  } catch (error) {
    // Update the run record with the error
    console.error(`Pipeline execution failed:`, error);
    return updateRun(run.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      completedAt: new Date()
    }) as Run;
  }
}