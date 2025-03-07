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
import { toCamelCase, toSnakeCase } from '../utils/dbUtils';
import { Agent } from '../models/types';
import vm from 'vm';

// Test a tool function implementation
export const testFunction = async (req: Request, res: Response): Promise<void> => {
  const { code, args } = req.body;
  
  try {
    console.log(`Testing tool function with args:`, JSON.stringify(args));
    
    if (!code) {
      res.status(400).json({ error: 'Code is required' });
      return;
    }
    
    // Create a sandbox context for executing the code
    const script = new vm.Script(`(${code})(args)`);
    const context = vm.createContext({ args, console });
    
    // Execute the script with a timeout
    const result = await script.runInContext(context, { timeout: 5000 });
    console.log(`Function test completed with result:`, result);
    
    res.status(200).json({ result });
  } catch (error) {
    console.error(`Error testing function:`, error);
    res.status(500).json({
      error: 'Function execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all agents
export const getAgents = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const agents = await getAllAgents(req.userId);
    res.status(200).json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
};

// Get a single agent by ID
export const getAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`Getting agent details for ID: ${req.params.id}`);
    
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const agent = await getAgentById(req.params.id, req.userId);
    if (!agent) {
      console.log(`Agent with ID ${req.params.id} not found`);
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    // If includeLatestRun query param is true, add the latest run
    if (req.query.includeLatestRun === 'true') {
      console.log(`Including latest run for agent ${req.params.id}`);
      
      // Get all runs for this agent
      const allRuns = await getAllRuns(req.userId, { agentId: agent.id });
      
      // Sort by createdAt (newest first)
      const agentRuns = allRuns.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
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
export const createNewAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Creating new agent with data:', JSON.stringify(req.body, null, 2));
    
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
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
      user_id: req.userId,
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
    const newAgent = await createAgent(agentData, req.userId);
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
export const updateExistingAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Extract all fields that should be updatable
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
    
    // Validate structured output schema if provided
    if (structuredOutputSchema) {
      console.log('Validating structured output schema:', JSON.stringify(structuredOutputSchema, null, 2));
      
      // Get the schema object, depending on structure
      const schema = structuredOutputSchema.schema || structuredOutputSchema;
      
      // Make sure schema has a name
      if (!structuredOutputSchema.name) {
        structuredOutputSchema.name = 'structured_output_schema';
        console.log('Added missing name to schema:', structuredOutputSchema.name);
      }
      
      // Recursive function to validate and fix schemas
      const validateAndFixSchema = (schemaObject, path = '') => {
        if (!schemaObject || typeof schemaObject !== 'object') return;
        
        // Check required fields against properties at this level
        if (schemaObject.required && Array.isArray(schemaObject.required)) {
          const properties = schemaObject.properties || {};
          const fixedRequired = [];
          let needsFixing = false;
          
          // Check each required field
          for (const field of schemaObject.required) {
            if (!properties[field]) {
              console.warn(`${path}: Required field '${field}' not found in properties.`);
              
              // Try to find a matching property (camelCase, snake_case variations)
              const camelCaseField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
              const snakeCaseField = field.replace(/([A-Z])/g, "_$1").toLowerCase();
              
              if (properties[camelCaseField]) {
                console.log(`${path}: Using camelCase version: '${camelCaseField}' instead of '${field}'`);
                fixedRequired.push(camelCaseField);
                needsFixing = true;
              } else if (properties[snakeCaseField]) {
                console.log(`${path}: Using snake_case version: '${snakeCaseField}' instead of '${field}'`);
                fixedRequired.push(snakeCaseField);
                needsFixing = true;
              } else {
                // No easy fix found, keep the original but warn
                console.warn(`${path}: Couldn't find matching property for required field '${field}'`);
                fixedRequired.push(field);
              }
            } else {
              fixedRequired.push(field);
            }
            
            // Check for spaces in field names
            if (field.includes(' ')) {
              console.warn(`${path}: Property name contains spaces: '${field}'. This may cause issues.`);
            }
          }
          
          // Apply fixed required array if needed
          if (needsFixing) {
            console.log(`${path}: Fixed required fields: [${schemaObject.required.join(', ')}] -> [${fixedRequired.join(', ')}]`);
            schemaObject.required = fixedRequired;
          }
        }
        
        // Check for spaces in property names
        if (schemaObject.properties) {
          const properties = schemaObject.properties;
          
          Object.keys(properties).forEach(key => {
            const propPath = path ? `${path}.${key}` : key;
            
            // Check for spaces in this property name
            if (key.includes(' ')) {
              console.warn(`${propPath}: Property name contains spaces: '${key}'. This may cause issues.`);
            }
            
            // Recursively validate nested objects
            if (properties[key] && typeof properties[key] === 'object') {
              validateAndFixSchema(properties[key], propPath);
            }
          });
        }
        
        // Check items for array types
        if (schemaObject.type === 'array' && schemaObject.items) {
          validateAndFixSchema(schemaObject.items, `${path}[].items`);
        }
      };
      
      // Validate and potentially fix the schema
      validateAndFixSchema(schema);
    }
    
    // Fix schema name if present in the existing agent or the new data
    const agentId = req.params.id;
    const existingAgent = await getAgentById(agentId, req.userId);
    
    // Determine the schema to use (new one from request or fix existing one)
    let finalSchema = structuredOutputSchema;
    
    // If no new schema provided but existing has issues, fix the existing one
    if (!finalSchema && existingAgent?.structuredOutputSchema?.name?.includes(' ')) {
      console.log('Fixing invalid schema name in existing agent');
      
      // Create a fixed version of the schema with valid name (no spaces)
      finalSchema = {
        ...existingAgent.structuredOutputSchema,
        name: existingAgent.structuredOutputSchema.name.replace(/\s+/g, '_')
      };
      
      // Log the change
      console.log(`Updated schema name from "${existingAgent.structuredOutputSchema.name}" to "${finalSchema.name}"`);
    }

    // Create update object with all fields
    const updateData: any = {
      name,
      model,
      systemPrompt,
      tools,
      structuredOutputSchema: finalSchema,
      autoExecuteTools,
      cognition,
      chainRun,
      maxChainIterations,
      forceTool,
      additionalParams
    };
    
    const updatedAgent = await updateAgent(req.params.id, updateData, req.userId);

    if (!updatedAgent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    res.status(200).json(updatedAgent);
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ 
      error: 'Failed to update agent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete an agent
export const deleteExistingAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const deleted = await deleteAgent(req.params.id, req.userId);
    if (!deleted) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ 
      error: 'Failed to delete agent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Run a single agent
export const runSingleAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`Running agent with ID: ${req.params.id}`);
    
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const agent = await getAgentById(req.params.id, req.userId);
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
    const run = await createRun({
      user_id: req.userId,
      agentId: agent.id,
      input,
      outputs: [],
      status: 'running',
    }, req.userId);
    
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
      // Ensure completedAt is a valid Date object to avoid timestamp errors
      await updateRun(run.id, {
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
        completedAt: new Date() // Ensure this is a Date object, not toISOString()
      }, req.userId);

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
      // Ensure completedAt is a Date object to prevent timestamp errors
      await updateRun(run.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        completedAt: new Date() // Using Date object directly
      }, req.userId);

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
export const getAgentRuns = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`Getting all runs for agent ID: ${req.params.id}`);
    
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // First check if the agent exists
    const agent = await getAgentById(req.params.id, req.userId);
    if (!agent) {
      console.log(`Agent with ID ${req.params.id} not found`);
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    // Get all runs for this agent
    const agentRuns = await getAllRuns(req.userId, { agentId: agent.id });
    
    // Sort by createdAt (newest first) and map to simplified objects
    const sortedRuns = agentRuns
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
      
    console.log(`Found ${sortedRuns.length} runs for agent ${agent.id}`);
    
    res.status(200).json({
      agentId: agent.id,
      agentName: agent.name,
      runCount: sortedRuns.length,
      runs: sortedRuns
    });
  } catch (error) {
    console.error(`Error getting agent runs:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch agent runs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};