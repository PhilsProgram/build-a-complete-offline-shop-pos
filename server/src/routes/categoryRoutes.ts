import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory
} from '../controllers/categoryController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const categoryRoutes = Router();

categoryRoutes.use(authenticate);
categoryRoutes.get('/', listCategories);
categoryRoutes.post('/', requireRole('ADMIN'), createCategory);
categoryRoutes.put('/:id', requireRole('ADMIN'), updateCategory);
categoryRoutes.delete('/:id', requireRole('ADMIN'), deleteCategory);
