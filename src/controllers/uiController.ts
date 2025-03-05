import { Request, Response } from 'express';
import { getAllAgents, getAllPipelines, getAllRuns } from '../db/database';

// Render the home page
export const renderHomePage = (req: Request, res: Response): void => {
  res.render('index');
};

// Render the agents page
export const renderAgentsPage = (req: Request, res: Response): void => {
  const agents = getAllAgents();
  res.render('agents', { agents });
};

// Render the agent creation page
export const renderAgentCreationPage = (req: Request, res: Response): void => {
  res.render('create-agent');
};

// Render the pipelines page
export const renderPipelinesPage = (req: Request, res: Response): void => {
  const pipelines = getAllPipelines();
  const agents = getAllAgents();
  res.render('pipelines', { pipelines, agents });
};

// Render the pipeline creation page
export const renderPipelineCreationPage = (req: Request, res: Response): void => {
  const agents = getAllAgents();
  res.render('create-pipeline', { agents });
};

// Render the runs page
export const renderRunsPage = (req: Request, res: Response): void => {
  const runs = getAllRuns();
  res.render('runs', { runs });
};

// Render the run details page
export const renderRunDetailsPage = (req: Request, res: Response): void => {
  res.render('run-details', { runId: req.params.id });
};