import express, { Request, Response } from 'express';
import { getRunById } from '../db/database';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Get run details by ID
router.get('/:id', (req, res, next) => {
  authenticate(req, res, async () => {
    try {
      const runId = req.params.id;
      
      // Get user ID from the auth middleware
      if (!req.userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      const run = await getRunById(runId, req.userId);
      
      if (!run) {
        res.status(404).json({ error: 'Run not found' });
        return;
      }
      
      res.status(200).json(run);
    } catch (error) {
      console.error('Error fetching run:', error);
      res.status(500).json({ 
        error: 'Failed to fetch run',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
});

export default router;