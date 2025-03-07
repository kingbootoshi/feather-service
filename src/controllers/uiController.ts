import { Request, Response } from 'express';
import { getPublicSupabaseConfig } from '../utils/supabase';

// Render the home page
export const renderHomePage = (req: Request, res: Response): void => {
  res.render('index');
};

// Render the login page
export const renderLoginPage = (req: Request, res: Response): void => {
  res.render('login', { 
    supabaseConfig: getPublicSupabaseConfig() 
  });
};

// Render the registration page
export const renderRegisterPage = (req: Request, res: Response): void => {
  res.render('register', { 
    supabaseConfig: getPublicSupabaseConfig() 
  });
};

// Render the profile page
export const renderProfilePage = (req: Request, res: Response): void => {
  res.render('profile');
};

// Render the agents page
export const renderAgentsPage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Import here to avoid circular dependencies
    const { getAllAgents } = await import('../db/database');
    
    // Get agents for this user
    const agents = await getAllAgents(req.userId || '');
    
    res.render('agents', { agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.render('agents', { agents: [] });
  }
};

// Render the agent creation page
export const renderAgentCreationPage = (req: Request, res: Response): void => {
  res.render('create-agent');
};

// Render the pipelines page
export const renderPipelinesPage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Import here to avoid circular dependencies
    const { getAllPipelines, getAllAgents } = await import('../db/database');
    
    // Get pipelines and agents for this user
    const pipelines = await getAllPipelines(req.userId || '');
    const agents = await getAllAgents(req.userId || '');
    
    res.render('pipelines', { pipelines, agents });
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    res.render('pipelines', { pipelines: [], agents: [] });
  }
};

// Render the pipeline creation page
export const renderPipelineCreationPage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Import here to avoid circular dependencies
    const { getAllAgents } = await import('../db/database');
    
    // Get agents for this user
    const agents = await getAllAgents(req.userId || '');
    
    res.render('create-pipeline', { agents });
  } catch (error) {
    console.error('Error fetching agents for pipeline creation:', error);
    res.render('create-pipeline', { agents: [] });
  }
};

// Render the runs page
export const renderRunsPage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Import here to avoid circular dependencies
    const { getAllRuns } = await import('../db/database');
    
    // Get runs for this user
    const runs = await getAllRuns(req.userId || '');
    
    res.render('runs', { runs });
  } catch (error) {
    console.error('Error fetching runs:', error);
    res.render('runs', { runs: [] });
  }
};

// Render the run details page
export const renderRunDetailsPage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Import here to avoid circular dependencies
    const { getRunById } = await import('../db/database');
    
    // Get the run details
    const runId = req.params.id;
    const run = await getRunById(runId, req.userId);
    
    if (!run) {
      return res.status(404).render('error', { 
        message: 'Run not found',
        error: { status: 404, stack: '' } 
      });
    }
    
    res.render('run-details', { runId, run });
  } catch (error) {
    console.error(`Error fetching run ${req.params.id}:`, error);
    res.render('run-details', { runId: req.params.id, run: null });
  }
};