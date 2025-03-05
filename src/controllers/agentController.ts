import { Request, Response } from 'express';
import {
  getAllAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  createRun,
  updateRun
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
    const agent = getAgentById(req.params.id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }
    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
};

// Create a new agent
export const createNewAgent = (req: Request, res: Response): void => {
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

    // Validate required fields
    if (!name || !model || !systemPrompt) {
      res.status(400).json({ error: 'Name, model, and systemPrompt are required' });
      return;
    }

    const agentData: Omit<Agent, 'id' | 'createdAt'> = {
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
    };

    const newAgent = createAgent(agentData);
    res.status(201).json(newAgent);
  } catch (error) {
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
    const agent = getAgentById(req.params.id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    const { input } = req.body;
    if (!input) {
      res.status(400).json({ error: 'Input is required' });
      return;
    }

    // Create a new run record
    const run = createRun({
      agentId: agent.id,
      input,
      outputs: [],
      status: 'running',
    });

    // Run the agent asynchronously
    try {
      const result = await runAgent(agent, input);
      
      // Update the run record
      updateRun(run.id, {
        outputs: [
          {
            agentId: agent.id,
            output: result.output,
            timestamp: new Date()
          }
        ],
        status: result.success ? 'completed' : 'failed',
        finalOutput: result.output,
        error: result.error,
        completedAt: new Date()
      });

      res.status(200).json({ 
        runId: run.id,
        success: result.success,
        output: result.output,
        error: result.error
      });
    } catch (error) {
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
    res.status(500).json({ 
      error: 'Failed to run agent',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};