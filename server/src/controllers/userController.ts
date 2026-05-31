import { z } from 'zod';
import { db } from '../database/connection.js';
import { audit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword } from '../utils/password.js';

const createUserSchema = z.object({
  name: z.string().trim().min(2),
  username: z.string().trim().min(3),
  password: z.string().min(4),
  role: z.enum(['ADMIN', 'EMPLOYEE']).default('EMPLOYEE'),
  active: z.boolean().default(true)
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  username: z.string().trim().min(3).optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional(),
  active: z.boolean().optional()
});

const resetPasswordSchema = z.object({
  password: z.string().min(4)
});

export const listUsers = asyncHandler((req, res) => {
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  const rows = db.prepare(`
    SELECT id, name, username, role, active, created_at, updated_at
    FROM users
    WHERE (@role IS NULL OR role = @role)
    ORDER BY created_at DESC
  `).all({ role: role ?? null });

  res.json({ users: rows });
});

export const createUser = asyncHandler((req, res) => {
  const input = createUserSchema.parse(req.body);
  const result = db.prepare(`
    INSERT INTO users (name, username, role, password_hash, active)
    VALUES (@name, @username, @role, @passwordHash, @active)
  `).run({
    name: input.name,
    username: input.username,
    role: input.role,
    passwordHash: hashPassword(input.password),
    active: input.active ? 1 : 0
  });

  const id = Number(result.lastInsertRowid);
  audit(req.user?.id, 'CREATE', 'users', id, { username: input.username, role: input.role });
  res.status(201).json({ id });
});

export const updateUser = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const input = updateUserSchema.parse(req.body);
  const existing = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id) as { id: number; role: string } | undefined;

  if (!existing) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  if (input.active === false && existing.role === 'ADMIN') {
    const activeAdmins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND active = 1 AND id != ?").get(id) as { count: number };
    if (activeAdmins.count === 0) {
      res.status(400).json({ message: 'At least one active admin account is required.' });
      return;
    }
  }

  db.prepare(`
    UPDATE users
    SET
      name = COALESCE(@name, name),
      username = COALESCE(@username, username),
      role = COALESCE(@role, role),
      active = COALESCE(@active, active)
    WHERE id = @id
  `).run({
    id,
    name: input.name ?? null,
    username: input.username ?? null,
    role: input.role ?? null,
    active: input.active === undefined ? null : input.active ? 1 : 0
  });

  audit(req.user?.id, 'UPDATE', 'users', id, input);
  res.json({ id });
});

export const resetUserPassword = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const input = resetPasswordSchema.parse(req.body);
  const result = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(input.password), id);

  if (result.changes === 0) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  audit(req.user?.id, 'RESET_PASSWORD', 'users', id);
  res.json({ id });
});

export const deleteUser = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id) as { id: number; role: string } | undefined;

  if (!existing) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  if (existing.role === 'ADMIN') {
    const otherAdmins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND id != ?").get(id) as { count: number };
    if (otherAdmins.count === 0) {
      res.status(400).json({ message: 'At least one admin account is required.' });
      return;
    }
  }

  const hasTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE employee_id = ?').get(id) as { count: number };
  if (hasTransactions.count > 0) {
    db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(id);
  } else {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }

  audit(req.user?.id, 'DELETE_OR_DISABLE', 'users', id);
  res.status(204).send();
});

export const userPerformance = asyncHandler((req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare(`
    SELECT
      u.id,
      u.name,
      u.username,
      COUNT(t.id) as transaction_count,
      COALESCE(SUM(t.total), 0) as revenue,
      COALESCE(SUM(t.profit), 0) as profit
    FROM users u
    LEFT JOIN transactions t ON t.employee_id = u.id
    WHERE u.id = ?
    GROUP BY u.id
  `).get(id);

  if (!row) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  res.json({ performance: row });
});
