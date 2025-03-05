import express from 'express';
import * as controller from '../controllers/agentController';

const router = express.Router();

// The controller functions now have proper return types
router.get('/', controller.getAgents);
router.get('/:id', controller.getAgent);
router.post('/', controller.createNewAgent);
router.put('/:id', controller.updateExistingAgent);
router.delete('/:id', controller.deleteExistingAgent);
router.post('/:id/run', controller.runSingleAgent);

export default router;