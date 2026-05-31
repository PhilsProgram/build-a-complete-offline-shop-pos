import { z } from 'zod';
import { db } from '../database/connection.js';
import { audit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const customerSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable()
});

const debtorSchema = z.object({
  customerId: z.number().int().positive(),
  transactionId: z.number().int().positive().optional().nullable(),
  amountDue: z.number().nonnegative(),
  amountPaid: z.number().nonnegative().default(0),
  dueDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable()
});

const paymentSchema = z.object({
  amount: z.number().positive()
});

export const listCustomers = asyncHandler((req, res) => {
  const search = typeof req.query.search === 'string' ? `%${req.query.search}%` : null;
  const customers = db.prepare(`
    SELECT
      c.id,
      c.name,
      c.phone,
      c.email,
      c.address,
      c.notes,
      COALESCE(SUM(d.amount_due - d.amount_paid), 0) as balance,
      c.created_at as createdAt,
      c.updated_at as updatedAt
    FROM customers c
    LEFT JOIN debtors d ON d.customer_id = c.id AND d.status != 'PAID'
    WHERE (@search IS NULL OR c.name LIKE @search OR c.phone LIKE @search)
    GROUP BY c.id
    ORDER BY c.name ASC
  `).all({ search });

  res.json({ customers });
});

export const createCustomer = asyncHandler((req, res) => {
  const input = customerSchema.parse(req.body);
  const result = db.prepare(`
    INSERT INTO customers (name, phone, email, address, notes)
    VALUES (@name, @phone, @email, @address, @notes)
  `).run({
    name: input.name,
    phone: input.phone ?? null,
    email: input.email ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null
  });

  const id = Number(result.lastInsertRowid);
  audit(req.user?.id, 'CREATE', 'customers', id, input);
  res.status(201).json({ id });
});

export const updateCustomer = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const input = customerSchema.partial().parse(req.body);
  const result = db.prepare(`
    UPDATE customers
    SET
      name = COALESCE(@name, name),
      phone = COALESCE(@phone, phone),
      email = COALESCE(@email, email),
      address = COALESCE(@address, address),
      notes = COALESCE(@notes, notes)
    WHERE id = @id
  `).run({
    id,
    name: input.name ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null
  });

  if (result.changes === 0) {
    res.status(404).json({ message: 'Customer not found.' });
    return;
  }

  audit(req.user?.id, 'UPDATE', 'customers', id, input);
  res.json({ id });
});

export const deleteCustomer = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const openDebt = db.prepare("SELECT COUNT(*) as count FROM debtors WHERE customer_id = ? AND status != 'PAID'").get(id) as { count: number };

  if (openDebt.count > 0) {
    res.status(400).json({ message: 'Customer has open debt records.' });
    return;
  }

  const result = db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ message: 'Customer not found.' });
    return;
  }

  audit(req.user?.id, 'DELETE', 'customers', id);
  res.status(204).send();
});

export const listDebtors = asyncHandler((req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : null;
  const debtors = db.prepare(`
    SELECT
      d.id,
      d.customer_id as customerId,
      c.name as customerName,
      c.phone as customerPhone,
      d.transaction_id as transactionId,
      t.receipt_no as receiptNo,
      d.amount_due as amountDue,
      d.amount_paid as amountPaid,
      ROUND(d.amount_due - d.amount_paid, 2) as balance,
      d.due_date as dueDate,
      d.status,
      d.notes,
      d.created_at as createdAt,
      d.updated_at as updatedAt
    FROM debtors d
    JOIN customers c ON c.id = d.customer_id
    LEFT JOIN transactions t ON t.id = d.transaction_id
    WHERE (@status IS NULL OR d.status = @status)
    ORDER BY d.created_at DESC
  `).all({ status });

  res.json({ debtors });
});

export const createDebtor = asyncHandler((req, res) => {
  const input = debtorSchema.parse(req.body);
  const status = input.amountPaid >= input.amountDue ? 'PAID' : input.amountPaid > 0 ? 'PARTIAL' : 'OPEN';
  const result = db.prepare(`
    INSERT INTO debtors (customer_id, transaction_id, amount_due, amount_paid, due_date, status, notes)
    VALUES (@customerId, @transactionId, @amountDue, @amountPaid, @dueDate, @status, @notes)
  `).run({
    customerId: input.customerId,
    transactionId: input.transactionId ?? null,
    amountDue: input.amountDue,
    amountPaid: input.amountPaid,
    dueDate: input.dueDate ?? null,
    notes: input.notes ?? null,
    status
  });

  const id = Number(result.lastInsertRowid);
  audit(req.user?.id, 'CREATE', 'debtors', id, input);
  res.status(201).json({ id });
});

export const recordDebtPayment = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const input = paymentSchema.parse(req.body);
  const debtor = db.prepare('SELECT amount_due, amount_paid FROM debtors WHERE id = ?').get(id) as { amount_due: number; amount_paid: number } | undefined;

  if (!debtor) {
    res.status(404).json({ message: 'Debt record not found.' });
    return;
  }

  const newPaid = Number(Math.min(debtor.amount_due, debtor.amount_paid + input.amount).toFixed(2));
  const status = newPaid >= debtor.amount_due ? 'PAID' : 'PARTIAL';
  db.prepare('UPDATE debtors SET amount_paid = ?, status = ? WHERE id = ?').run(newPaid, status, id);

  audit(req.user?.id, 'PAYMENT', 'debtors', id, input);
  res.json({ id, amountPaid: newPaid, status });
});

export const deleteDebtor = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM debtors WHERE id = ?').run(id);

  if (result.changes === 0) {
    res.status(404).json({ message: 'Debt record not found.' });
    return;
  }

  audit(req.user?.id, 'DELETE', 'debtors', id);
  res.status(204).send();
});
