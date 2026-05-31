import bcrypt from 'bcryptjs';

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compareSync(password, passwordHash);
}
