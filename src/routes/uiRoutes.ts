import express from 'express';
import * as controller from '../controllers/uiController';
import { requireSupabaseSession } from '../middleware/auth';

const router = express.Router();

// Public pages
router.get('/', controller.renderHomePage);
router.get('/login', controller.renderLoginPage);
router.get('/register', controller.renderRegisterPage);

// Protected pages - require authentication
router.get('/profile', requireSupabaseSession, controller.renderProfilePage);
router.get('/agents', requireSupabaseSession, controller.renderAgentsPage);
router.get('/agents/new', requireSupabaseSession, controller.renderAgentCreationPage);
router.get('/agents/edit/:id', requireSupabaseSession, async (req, res) => {
  try {
    // Import to avoid circular dependencies
    const { getAgentById } = await import('../db/database');
    
    // Get the agent data
    const agentId = req.params.id;
    const agent = await getAgentById(agentId, req.userId);
    
    if (!agent) {
      return res.status(404).render('error', { 
        message: 'Agent not found',
        error: { status: 404, stack: '' } 
      });
    }
    
    // Render the edit page with agent data
    res.render('agents-edit', { agent });
  } catch (error) {
    console.error('Error rendering agent edit page:', error);
    res.status(500).render('error', {
      message: 'Error loading agent',
      error: { status: 500, stack: process.env.NODE_ENV === 'development' ? error.stack : '' }
    });
  }
});
router.get('/pipelines', requireSupabaseSession, controller.renderPipelinesPage);
router.get('/pipelines/new', requireSupabaseSession, controller.renderPipelineCreationPage);
router.get('/runs', requireSupabaseSession, controller.renderRunsPage);
router.get('/runs/:id', requireSupabaseSession, controller.renderRunDetailsPage);

export default router;