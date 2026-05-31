import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const settingsRoutes = Router();

settingsRoutes.use(authenticate);
settingsRoutes.get('/', getSettings);
settingsRoutes.put('/', requireRole('ADMIN'), updateSettings);
