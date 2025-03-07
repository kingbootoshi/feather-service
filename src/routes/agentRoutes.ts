import express from 'express';
import * as controller from '../controllers/agentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Main routes - add authentication to all except test-function
router.get('/', (req, res, next) => {
  authenticate(req, res, () => controller.getAgents(req, res));
});
router.post('/', (req, res, next) => {
  authenticate(req, res, () => controller.createNewAgent(req, res));
});
router.post('/test-function', controller.testFunction); // No auth required

// Routes for specific agents
router.get('/:id', (req, res, next) => {
  authenticate(req, res, () => controller.getAgent(req, res));
});
router.put('/:id', (req, res, next) => {
  authenticate(req, res, () => controller.updateExistingAgent(req, res));
});
router.delete('/:id', (req, res, next) => {
  authenticate(req, res, () => controller.deleteExistingAgent(req, res));
});
router.post('/:id/run', (req, res, next) => {
  authenticate(req, res, () => controller.runSingleAgent(req, res));
});
router.get('/:id/runs', (req, res, next) => {
  authenticate(req, res, () => controller.getAgentRuns(req, res));
});

export default router;