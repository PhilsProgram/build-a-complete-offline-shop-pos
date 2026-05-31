import { Router } from 'express';
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  updateUser,
  userPerformance
} from '../controllers/userController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const userRoutes = Router();

userRoutes.use(authenticate, requireRole('ADMIN'));
userRoutes.get('/', listUsers);
userRoutes.post('/', createUser);
userRoutes.get('/:id/performance', userPerformance);
userRoutes.put('/:id', updateUser);
userRoutes.patch('/:id/password', resetUserPassword);
userRoutes.delete('/:id', deleteUser);
