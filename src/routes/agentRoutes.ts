import express from 'express';
import * as controller from '../controllers/agentController';

const router = express.Router();

// Main routes
router.get('/', controller.getAgents);
router.post('/', controller.createNewAgent);

// Routes for specific agents
router.get('/:id', controller.getAgent);
router.put('/:id', controller.updateExistingAgent);
router.delete('/:id', controller.deleteExistingAgent);
router.post('/:id/run', controller.runSingleAgent);
router.get('/:id/runs', controller.getAgentRuns); // New route to get all runs for an agent

export default router;