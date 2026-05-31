import { Router } from 'express';
import { closeEod, getEodExpected, listEodRecords } from '../controllers/eodController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const eodRoutes = Router();

eodRoutes.use(authenticate, requireRole('ADMIN'));
eodRoutes.get('/', listEodRecords);
eodRoutes.get('/expected', getEodExpected);
eodRoutes.post('/', closeEod);
