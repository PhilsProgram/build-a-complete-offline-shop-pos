import type { NextFunction, Request, Response } from 'express';
import { db } from '../database/connection.js';
import type { AuthUser, UserRole } from '../types/domain.js';
import { verifyToken } from '../utils/jwt.js';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: 'Authentication token is required.' });
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = db.prepare(`
      SELECT id, name, username, role, active
      FROM users
      WHERE id = ?
    `).get(payload.id) as AuthUser | undefined;

    if (!user || !user.active) {
      res.status(401).json({ message: 'User is inactive or no longer exists.' });
      return;
    }

    req.user = {
      ...user,
      active: Boolean(user.active)
    };

    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'You do not have permission to access this resource.' });
      return;
    }

    next();
  };
}
