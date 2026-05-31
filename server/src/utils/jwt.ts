import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import type { AuthUser, JwtUserPayload } from '../types/domain.js';

export function signToken(user: AuthUser) {
  const payload: JwtUserPayload = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  const options: jwt.SignOptions = {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn']
  };

  return jwt.sign(payload, config.jwtSecret as jwt.Secret, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as JwtUserPayload;
}
