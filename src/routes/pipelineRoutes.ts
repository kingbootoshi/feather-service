import express from 'express';
import * as controller from '../controllers/pipelineController';

const router = express.Router();

// Make sure specific routes come before parameterized routes
router.get('/runs/:runId', controller.getRun); 
router.get('/', controller.getPipelines);
router.post('/', controller.createNewPipeline);

// Routes for specific pipelines
router.get('/:id', controller.getPipeline);
router.put('/:id', controller.updateExistingPipeline);
router.delete('/:id', controller.deleteExistingPipeline);
router.post('/:id/run', controller.runExistingPipeline);
router.get('/:id/runs', controller.getPipelineRuns); // New route to get all runs for a pipeline

export default router;