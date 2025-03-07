import express from 'express';
import * as controller from '../controllers/pipelineController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Make sure specific routes come before parameterized routes - all with auth
router.get('/runs/:runId', (req, res, next) => {
  authenticate(req, res, () => controller.getRun(req, res));
});
router.get('/', (req, res, next) => {
  authenticate(req, res, () => controller.getPipelines(req, res));
});
router.post('/', (req, res, next) => {
  authenticate(req, res, () => controller.createNewPipeline(req, res));
});

// Routes for specific pipelines
router.get('/:id', (req, res, next) => {
  authenticate(req, res, () => controller.getPipeline(req, res));
});
router.put('/:id', (req, res, next) => {
  authenticate(req, res, () => controller.updateExistingPipeline(req, res));
});
router.delete('/:id', (req, res, next) => {
  authenticate(req, res, () => controller.deleteExistingPipeline(req, res));
});
router.post('/:id/run', (req, res, next) => {
  authenticate(req, res, () => controller.runExistingPipeline(req, res));
});
router.get('/:id/runs', (req, res, next) => {
  authenticate(req, res, () => controller.getPipelineRuns(req, res));
});

export default router;