import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { backupRoutes } from './backupRoutes.js';
import { categoryRoutes } from './categoryRoutes.js';
import { customerRoutes } from './customerRoutes.js';
import { eodRoutes } from './eodRoutes.js';
import { expenseRoutes } from './expenseRoutes.js';
import { productRoutes } from './productRoutes.js';
import { reportRoutes } from './reportRoutes.js';
import { settingsRoutes } from './settingsRoutes.js';
import { transactionRoutes } from './transactionRoutes.js';
import { userRoutes } from './userRoutes.js';

export const apiRoutes = Router();

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/users', userRoutes);
apiRoutes.use('/categories', categoryRoutes);
apiRoutes.use('/products', productRoutes);
apiRoutes.use('/customers', customerRoutes);
apiRoutes.use('/transactions', transactionRoutes);
apiRoutes.use('/expenses', expenseRoutes);
apiRoutes.use('/reports', reportRoutes);
apiRoutes.use('/eod', eodRoutes);
apiRoutes.use('/settings', settingsRoutes);
apiRoutes.use('/backups', backupRoutes);
