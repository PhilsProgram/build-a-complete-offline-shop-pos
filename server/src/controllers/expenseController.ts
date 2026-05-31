import { z } from 'zod';
import { db } from '../database/connection.js';
import { audit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const expenseSchema = z.object({
  category: z.string().trim().min(2),
  description: z.string().trim().min(2),
  amount: z.number().nonnegative(),
  paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE_MONEY', 'BANK']).default('CASH'),
  expenseDate: z.string().trim().optional().nullable()
});

export const listExpenses = asyncHandler((req, res) => {
  const from = typeof req.query.from === 'string' ? req.query.from : null;
  const to = typeof req.query.to === 'string' ? req.query.to : null;

  const expenses = db.prepare(`
    SELECT
      e.id,
      e.category,
      e.description,
      e.amount,
      e.payment_method as paymentMethod,
      e.expense_date as expenseDate,
      u.name as recordedByName,
      e.created_at as createdAt,
      e.updated_at as updatedAt
    FROM expenses e
    JOIN users u ON u.id = e.recorded_by
    WHERE (@from IS NULL OR e.expense_date >= @from)
      AND (@to IS NULL OR e.expense_date <= @to)
    ORDER BY e.expense_date DESC
  `).all({ from, to });

  res.json({ expenses });
});

export const createExpense = asyncHandler((req, res) => {
  const input = expenseSchema.parse(req.body);
  const result = db.prepare(`
    INSERT INTO expenses (category, description, amount, payment_method, recorded_by, expense_date)
    VALUES (@category, @description, @amount, @paymentMethod, @recordedBy, COALESCE(@expenseDate, CURRENT_TIMESTAMP))
  `).run({
    ...input,
    recordedBy: req.user?.id,
    expenseDate: input.expenseDate ?? null
  });

  const id = Number(result.lastInsertRowid);
  audit(req.user?.id, 'CREATE', 'expenses', id, input);
  res.status(201).json({ id });
});

export const updateExpense = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const input = expenseSchema.partial().parse(req.body);
  const result = db.prepare(`
    UPDATE expenses
    SET
      category = COALESCE(@category, category),
      description = COALESCE(@description, description),
      amount = COALESCE(@amount, amount),
      payment_method = COALESCE(@paymentMethod, payment_method),
      expense_date = COALESCE(@expenseDate, expense_date)
    WHERE id = @id
  `).run({
    id,
    category: input.category ?? null,
    description: input.description ?? null,
    amount: input.amount ?? null,
    paymentMethod: input.paymentMethod ?? null,
    expenseDate: input.expenseDate ?? null
  });

  if (result.changes === 0) {
    res.status(404).json({ message: 'Expense not found.' });
    return;
  }

  audit(req.user?.id, 'UPDATE', 'expenses', id, input);
  res.json({ id });
});

export const deleteExpense = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);

  if (result.changes === 0) {
    res.status(404).json({ message: 'Expense not found.' });
    return;
  }

  audit(req.user?.id, 'DELETE', 'expenses', id);
  res.status(204).send();
});
