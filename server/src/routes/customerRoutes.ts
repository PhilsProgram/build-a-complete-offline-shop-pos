import { Router } from 'express';
import {
  createCustomer,
  createDebtor,
  deleteCustomer,
  deleteDebtor,
  listCustomers,
  listDebtors,
  recordDebtPayment,
  updateCustomer
} from '../controllers/customerController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const customerRoutes = Router();

customerRoutes.use(authenticate);
customerRoutes.get('/', listCustomers);
customerRoutes.post('/', createCustomer);
customerRoutes.put('/:id', requireRole('ADMIN'), updateCustomer);
customerRoutes.delete('/:id', requireRole('ADMIN'), deleteCustomer);

customerRoutes.get('/debtors/list', requireRole('ADMIN'), listDebtors);
customerRoutes.post('/debtors', requireRole('ADMIN'), createDebtor);
customerRoutes.patch('/debtors/:id/payment', requireRole('ADMIN'), recordDebtPayment);
customerRoutes.delete('/debtors/:id', requireRole('ADMIN'), deleteDebtor);
