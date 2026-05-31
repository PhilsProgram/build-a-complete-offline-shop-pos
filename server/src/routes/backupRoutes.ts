import { Router } from 'express';
import {
  backupUpload,
  exportBackup,
  listBackups,
  restoreBackup
} from '../controllers/backupController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const backupRoutes = Router();

backupRoutes.use(authenticate, requireRole('ADMIN'));
backupRoutes.get('/', listBackups);
backupRoutes.post('/export', exportBackup);
backupRoutes.post('/restore', backupUpload.single('database'), restoreBackup);
