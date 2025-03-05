import express from 'express';
import * as controller from '../controllers/uiController';

const router = express.Router();

router.get('/', controller.renderHomePage);
router.get('/agents', controller.renderAgentsPage);
router.get('/agents/new', controller.renderAgentCreationPage);
router.get('/pipelines', controller.renderPipelinesPage);
router.get('/pipelines/new', controller.renderPipelineCreationPage);
router.get('/runs', controller.renderRunsPage);
router.get('/runs/:id', controller.renderRunDetailsPage);

export default router;