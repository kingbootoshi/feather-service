import express from 'express';
import * as controller from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected routes (require authentication)
router.post('/api-keys', (req, res, next) => {
  authenticate(req, res, () => controller.generateApiKey(req, res));
});
router.get('/api-keys', (req, res, next) => {
  authenticate(req, res, () => controller.getApiKeys(req, res));
});
router.delete('/api-keys/:id', (req, res, next) => {
  authenticate(req, res, () => controller.removeApiKey(req, res));
});

export default router;