import { Router } from 'express';
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense
} from '../controllers/expenseController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const expenseRoutes = Router();

expenseRoutes.use(authenticate, requireRole('ADMIN'));
expenseRoutes.get('/', listExpenses);
expenseRoutes.post('/', createExpense);
expenseRoutes.put('/:id', updateExpense);
expenseRoutes.delete('/:id', deleteExpense);
