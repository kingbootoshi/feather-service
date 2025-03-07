import { Request, Response } from 'express';
import {
  getAllPipelines,
  getPipelineById,
  createPipeline,
  updatePipeline,
  deletePipeline,
  getRunById,
  getAllRuns
} from '../db/database';
import { runPipeline } from '../utils/pipelineService';
import { Pipeline } from '../models/types';

// Get all pipelines
export const getPipelines = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const pipelines = await getAllPipelines(req.userId);
    res.status(200).json(pipelines);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    res.status(500).json({ error: 'Failed to fetch pipelines' });
  }
};

// Get a single pipeline by ID
export const getPipeline = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`Getting pipeline details for ID: ${req.params.id}`);
    
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const pipeline = await getPipelineById(req.params.id, req.userId);
    if (!pipeline) {
      console.log(`Pipeline with ID ${req.params.id} not found`);
      res.status(404).json({ error: 'Pipeline not found' });
      return;
    }
    
    // If includeLatestRun query param is true, add the latest run
    if (req.query.includeLatestRun === 'true') {
      console.log(`Including latest run for pipeline ${req.params.id}`);
      
      // Get all runs for this pipeline
      const allRuns = await getAllRuns(req.userId, { pipelineId: pipeline.id });
      
      // Sort by createdAt (newest first)
      const pipelineRuns = allRuns.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Add latest run if exists
      if (pipelineRuns.length > 0) {
        const latestRun = pipelineRuns[0];
        console.log(`Found latest run: ${latestRun.id}, status: ${latestRun.status}`);
        
        res.status(200).json({
          ...pipeline,
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
        console.log(`No runs found for pipeline ${req.params.id}`);
      }
    }
    
    // Return just the pipeline if no latest run requested or none found
    res.status(200).json(pipeline);
  } catch (error) {
    console.error(`Error getting pipeline details:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch pipeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create a new pipeline
export const createNewPipeline = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
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
      user_id: req.userId,
      name,
      description: description || '',
      steps,
      outputDestinations
    };

    const newPipeline = await createPipeline(pipelineData, req.userId);
    res.status(201).json(newPipeline);
  } catch (error) {
    console.error('Error creating pipeline:', error);
    res.status(500).json({ 
      error: 'Failed to create pipeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update an existing pipeline
export const updateExistingPipeline = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const { name, description, steps, outputDestinations } = req.body;

    const updatedPipeline = await updatePipeline(req.params.id, {
      name,
      description,
      steps,
      outputDestinations
    }, req.userId);

    if (!updatedPipeline) {
      res.status(404).json({ error: 'Pipeline not found' });
      return;
    }

    res.status(200).json(updatedPipeline);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    res.status(500).json({ 
      error: 'Failed to update pipeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete a pipeline
export const deleteExistingPipeline = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const deleted = await deletePipeline(req.params.id, req.userId);
    if (!deleted) {
      res.status(404).json({ error: 'Pipeline not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    res.status(500).json({ 
      error: 'Failed to delete pipeline',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Run a pipeline
export const runExistingPipeline = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`Running pipeline with ID: ${req.params.id}`);
    
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const pipeline = await getPipelineById(req.params.id, req.userId);
    if (!pipeline) {
      console.log(`Pipeline with ID ${req.params.id} not found`);
      res.status(404).json({ error: 'Pipeline not found' });
      return;
    }

    const { input } = req.body;
    if (!input) {
      console.log(`No input provided for pipeline run`);
      res.status(400).json({ error: 'Input is required' });
      return;
    }

    console.log(`Starting pipeline execution for ${pipeline.name} (${pipeline.id})`);
    
    // Run the pipeline asynchronously and return the run ID for tracking
    const run = await runPipeline(pipeline, input, req.userId);
    
    console.log(`Pipeline execution completed with status: ${run.status}`);
    
    res.status(200).json({
      runId: run.id,
      status: run.status,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      createdAt: run.createdAt,
      completedAt: run.completedAt,
      finalOutput: run.finalOutput,
      error: run.error,
    });
  } catch (error) {
    console.error(`Error running pipeline:`, error);
    res.status(500).json({ 
      error: 'Failed to run pipeline',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Get all runs for a pipeline
export const getPipelineRuns = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`Getting all runs for pipeline ID: ${req.params.id}`);
    
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // First check if the pipeline exists
    const pipeline = await getPipelineById(req.params.id, req.userId);
    if (!pipeline) {
      console.log(`Pipeline with ID ${req.params.id} not found`);
      res.status(404).json({ error: 'Pipeline not found' });
      return;
    }
    
    // Get all runs for this pipeline
    const allRuns = await getAllRuns(req.userId, { pipelineId: pipeline.id });
    
    // Sort by createdAt (newest first) and map to simplified objects
    const pipelineRuns = allRuns
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(run => ({
        id: run.id,
        status: run.status,
        createdAt: run.createdAt,
        completedAt: run.completedAt,
        input: run.input,
        finalOutput: run.finalOutput,
        error: run.error,
        stepCount: run.outputs.length
      }));
      
    console.log(`Found ${pipelineRuns.length} runs for pipeline ${pipeline.id}`);
    
    res.status(200).json({
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      runCount: pipelineRuns.length,
      runs: pipelineRuns
    });
  } catch (error) {
    console.error(`Error getting pipeline runs:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch pipeline runs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get a specific run
export const getRun = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`Getting run details for run ID: ${req.params.runId}`);
    
    // Get user ID from the auth middleware
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const run = await getRunById(req.params.runId, req.userId);
    
    if (!run) {
      console.log(`Run with ID ${req.params.runId} not found`);
      res.status(404).json({ error: 'Run not found' });
      return;
    }
    
    console.log(`Found run with ID ${req.params.runId}, status: ${run.status}`);
    
    // Return the full run details
    res.status(200).json(run);
  } catch (error) {
    console.error(`Error getting run details:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch run',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};