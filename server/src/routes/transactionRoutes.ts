import { Router } from 'express';
import {
  createTransaction,
  getTransaction,
  listTransactions
} from '../controllers/transactionController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const transactionRoutes = Router();

transactionRoutes.use(authenticate);
transactionRoutes.post('/', createTransaction);
transactionRoutes.get('/', listTransactions);
transactionRoutes.get('/:id', getTransaction);
