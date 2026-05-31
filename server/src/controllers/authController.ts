import { z } from 'zod';
import { db } from '../database/connection.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';
import { verifyPassword } from '../utils/password.js';

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  role: z.enum(['ADMIN', 'EMPLOYEE']).optional()
});

interface UserRow {
  id: number;
  name: string;
  username: string;
  role: 'ADMIN' | 'EMPLOYEE';
  password_hash: string;
  active: number;
}

export const login = asyncHandler((req, res) => {
  const input = loginSchema.parse(req.body);
  const user = db.prepare(`
    SELECT id, name, username, role, password_hash, active
    FROM users
    WHERE username = ?
  `).get(input.username) as UserRow | undefined;

  if (!user || !verifyPassword(input.password, user.password_hash)) {
    res.status(401).json({ message: 'Invalid username or password.' });
    return;
  }

  if (!user.active) {
    res.status(403).json({ message: 'This account is disabled.' });
    return;
  }

  if (input.role && user.role !== input.role) {
    res.status(403).json({ message: `This login is for ${input.role.toLowerCase()} accounts only.` });
    return;
  }

  const authUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    active: Boolean(user.active)
  };

  res.json({
    user: authUser,
    token: signToken(authUser)
  });
});

export const me = asyncHandler((req, res) => {
  res.json({ user: req.user });
});
