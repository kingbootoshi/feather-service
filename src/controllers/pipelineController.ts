import { Request, Response } from 'express';
import {
  getAllPipelines,
  getPipelineById,
  createPipeline,
  updatePipeline,
  deletePipeline,
  getRunById
} from '../db/database';
import { runPipeline } from '../utils/pipelineService';
import { Pipeline } from '../models/types';

// Get all pipelines
export const getPipelines = (req: Request, res: Response): void => {
  try {
    const pipelines = getAllPipelines();
    res.status(200).json(pipelines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pipelines' });
  }
};

// Get a single pipeline by ID
export const getPipeline = (req: Request, res: Response): void => {
  try {
    const pipeline = getPipelineById(req.params.id);
    if (!pipeline) {
      res.status(404).json({ error: 'Pipeline not found' });
      return;
    }
    res.status(200).json(pipeline);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pipeline' });
  }
};

// Create a new pipeline
export const createNewPipeline = (req: Request, res: Response): void => {
  try {
    const { name, description, steps, outputDestinations } = req.body;

    // Validate required fields
    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      res.status(400).json({ 
        error: 'Name and at least one step are required',
        details: 'Each step must have an agentId' 
      });
      return;
    }

    // Validate each step has an agentId
    for (const step of steps) {
      if (!step.agentId) {
        res.status(400).json({ 
          error: 'Each step must have an agentId' 
        });
        return;
      }
    }

    const pipelineData: Omit<Pipeline, 'id' | 'createdAt'> = {
      name,
      description: description || '',
      steps,
      outputDestinations
    };

    const newPipeline = createPipeline(pipelineData);
    res.status(201).json(newPipeline);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create pipeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update an existing pipeline
export const updateExistingPipeline = (req: Request, res: Response): void => {
  try {
    const { name, description, steps, outputDestinations } = req.body;

    const updatedPipeline = updatePipeline(req.params.id, {
      name,
      description,
      steps,
      outputDestinations
    });

    if (!updatedPipeline) {
      res.status(404).json({ error: 'Pipeline not found' });
      return;
    }

    res.status(200).json(updatedPipeline);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update pipeline' });
  }
};

// Delete a pipeline
export const deleteExistingPipeline = (req: Request, res: Response): void => {
  try {
    const deleted = deletePipeline(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Pipeline not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete pipeline' });
  }
};

// Run a pipeline
export const runExistingPipeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const pipeline = getPipelineById(req.params.id);
    if (!pipeline) {
      res.status(404).json({ error: 'Pipeline not found' });
      return;
    }

    const { input } = req.body;
    if (!input) {
      res.status(400).json({ error: 'Input is required' });
      return;
    }

    // Run the pipeline asynchronously and return the run ID for tracking
    const run = await runPipeline(pipeline, input);
    
    res.status(200).json({
      runId: run.id,
      status: run.status,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to run pipeline',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Get a specific run
export const getRun = (req: Request, res: Response): void => {
  try {
    const run = getRunById(req.params.runId);
    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }
    res.status(200).json(run);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch run' });
  }
};