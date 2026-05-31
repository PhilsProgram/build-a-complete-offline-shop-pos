import { Router } from 'express';
import {
  dashboard,
  employeePerformanceReport,
  productPerformance,
  salesReport
} from '../controllers/reportController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const reportRoutes = Router();

reportRoutes.use(authenticate, requireRole('ADMIN'));
reportRoutes.get('/dashboard', dashboard);
reportRoutes.get('/sales', salesReport);
reportRoutes.get('/products', productPerformance);
reportRoutes.get('/employees', employeePerformanceReport);
