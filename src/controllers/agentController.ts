import { Request, Response } from 'express';
import {
  getAllAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  createRun,
  updateRun,
  getAllRuns
} from '../db/database';
import { runAgent } from '../utils/agentService';
import { Agent } from '../models/types';

// Get all agents
export const getAgents = (req: Request, res: Response): void => {
  try {
    const agents = getAllAgents();
    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
};

// Get a single agent by ID
export const getAgent = (req: Request, res: Response): void => {
  try {
    console.log(`Getting agent details for ID: ${req.params.id}`);
    
    const agent = getAgentById(req.params.id);
    if (!agent) {
      console.log(`Agent with ID ${req.params.id} not found`);
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    // If includeLatestRun query param is true, add the latest run
    if (req.query.includeLatestRun === 'true') {
      console.log(`Including latest run for agent ${req.params.id}`);
      
      // Get all runs
      const allRuns = getAllRuns();
      
      // Filter runs for this agent and sort by createdAt (newest first)
      const agentRuns = allRuns
        .filter(run => run.agentId === agent.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Add latest run if exists
      if (agentRuns.length > 0) {
        const latestRun = agentRuns[0];
        console.log(`Found latest run: ${latestRun.id}, status: ${latestRun.status}`);
        
        res.status(200).json({
          ...agent,
          latestRun: {
            id: latestRun.id,
            status: latestRun.status,
            createdAt: latestRun.createdAt,
            completedAt: latestRun.completedAt,
            input: latestRun.input,
            finalOutput: latestRun.finalOutput,
            error: latestRun.error
          }
        });
        return;
      } else {
        console.log(`No runs found for agent ${req.params.id}`);
      }
    }
    
    // Return just the agent if no latest run requested or none found
    res.status(200).json(agent);
  } catch (error) {
    console.error(`Error getting agent details:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch agent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create a new agent
export const createNewAgent = (req: Request, res: Response): void => {
  try {
    console.log('Creating new agent with data:', JSON.stringify(req.body, null, 2));
    const {
      name,
      model,
      systemPrompt,
      tools,
      structuredOutputSchema,
      autoExecuteTools,
      cognition,
      chainRun,
      maxChainIterations,
      forceTool,
      additionalParams
    } = req.body;

    // Validate required fields
    if (!name || !model || !systemPrompt) {
      res.status(400).json({ error: 'Name, model, and systemPrompt are required' });
      return;
    }

    // Process tools if provided
    let processedTools = tools;
    if (tools && Array.isArray(tools)) {
      processedTools = tools.map(tool => {
        // If the tool has an implementation string, convert it to a function
        if (tool.implementation) {
          try {
            // Create a secure function from the implementation string
            // Note: In a production environment, this should be done with much more security
            // This is a simplified example for demonstration purposes
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const execFn = new AsyncFunction('args', tool.implementation);
            
            // Replace the implementation string with the actual function
            const processedTool = {
              ...tool,
              execute: async (args: Record<string, any>) => {
                console.log(`Executing tool ${tool.function.name} with args:`, args);
                try {
                  const result = await execFn(args);
                  console.log(`Tool ${tool.function.name} execution result:`, result);
                  return result;
                } catch (error) {
                  console.error(`Tool ${tool.function.name} execution error:`, error);
                  throw error;
                }
              }
            };
            
            delete processedTool.implementation; // Remove the implementation string
            return processedTool;
          } catch (error) {
            console.error('Error processing tool implementation:', error);
            throw new Error(`Invalid tool implementation for ${tool.function.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        return tool;
      });
    }

    const agentData: Omit<Agent, 'id' | 'createdAt'> = {
      name,
      model,
      systemPrompt,
      tools: processedTools,
      structuredOutputSchema,
      autoExecuteTools: autoExecuteTools !== undefined ? autoExecuteTools : true,
      cognition,
      chainRun,
      maxChainIterations,
      forceTool,
      additionalParams
    };

    console.log('Creating agent with processed data');
    const newAgent = createAgent(agentData);
    console.log('Agent created successfully:', newAgent.id);
    res.status(201).json(newAgent);
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ 
      error: 'Failed to create agent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update an existing agent
export const updateExistingAgent = (req: Request, res: Response): void => {
  try {
    const {
      name,
      model,
      systemPrompt,
      tools,
      structuredOutputSchema,
      autoExecuteTools,
      cognition,
      chainRun,
      maxChainIterations,
      forceTool
    } = req.body;

    const updatedAgent = updateAgent(req.params.id, {
      name,
      model,
      systemPrompt,
      tools,
      structuredOutputSchema,
      autoExecuteTools,
      cognition,
      chainRun,
      maxChainIterations,
      forceTool
    });

    if (!updatedAgent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    res.status(200).json(updatedAgent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agent' });
  }
};

// Delete an agent
export const deleteExistingAgent = (req: Request, res: Response): void => {
  try {
    const deleted = deleteAgent(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete agent' });
  }
};

// Run a single agent
export const runSingleAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`Running agent with ID: ${req.params.id}`);
    
    const agent = getAgentById(req.params.id);
    if (!agent) {
      console.log(`Agent with ID ${req.params.id} not found`);
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    const { input } = req.body;
    if (!input) {
      console.log(`No input provided for agent run`);
      res.status(400).json({ error: 'Input is required' });
      return;
    }

    console.log(`Creating run record for agent ${agent.name} (${agent.id})`);
    
    // Create a new run record
    const run = createRun({
      agentId: agent.id,
      input,
      outputs: [],
      status: 'running',
    });
    
    console.log(`Created run record with ID: ${run.id}`);

    // Run the agent asynchronously
    try {
      console.log(`Executing agent run`);
      const result = await runAgent(agent, input);
      
      console.log(`Agent execution completed with success: ${result.success}`);
      
      // Create metadata for the output
      const outputMeta = {
        functionCalls: result.functionCalls,
        structuredOutput: result.structuredOutput
      };
      
      // Update the run record with output and metadata
      console.log(`Updating run record with status: ${result.success ? 'completed' : 'failed'}`);
      updateRun(run.id, {
        outputs: [
          {
            agentId: agent.id,
            output: result.output,
            timestamp: new Date(),
            meta: outputMeta
          }
        ],
        status: result.success ? 'completed' : 'failed',
        finalOutput: result.output,
        finalOutputMeta: outputMeta,
        error: result.error,
        completedAt: new Date()
      });

      // Return response
      res.status(200).json({ 
        runId: run.id,
        success: result.success,
        output: result.output,
        outputType: result.structuredOutput ? 'structured' : 
                    (result.functionCalls && result.functionCalls.length > 0) ? 'functionCalls' : 'text',
        functionCalls: result.functionCalls,
        error: result.error,
        completedAt: new Date()
      });
    } catch (error) {
      console.error(`Error during agent execution:`, error);
      
      // Update the run record with the error
      updateRun(run.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        completedAt: new Date()
      });

      res.status(500).json({ 
        runId: run.id,
        error: 'Failed to run agent',
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  } catch (error) {
    console.error(`Error processing agent run request:`, error);
    res.status(500).json({ 
      error: 'Failed to run agent',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Get all runs for an agent
export const getAgentRuns = (req: Request, res: Response): void => {
  try {
    console.log(`Getting all runs for agent ID: ${req.params.id}`);
    
    // First check if the agent exists
    const agent = getAgentById(req.params.id);
    if (!agent) {
      console.log(`Agent with ID ${req.params.id} not found`);
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    // Get all runs
    const allRuns = getAllRuns();
    
    // Filter runs for this agent and sort by createdAt (newest first)
    const agentRuns = allRuns
      .filter(run => run.agentId === agent.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(run => ({
        id: run.id,
        status: run.status,
        createdAt: run.createdAt,
        completedAt: run.completedAt,
        input: run.input,
        finalOutput: run.finalOutput,
        error: run.error
      }));
      
    console.log(`Found ${agentRuns.length} runs for agent ${agent.id}`);
    
    res.status(200).json({
      agentId: agent.id,
      agentName: agent.name,
      runCount: agentRuns.length,
      runs: agentRuns
    });
  } catch (error) {
    console.error(`Error getting agent runs:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch agent runs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};