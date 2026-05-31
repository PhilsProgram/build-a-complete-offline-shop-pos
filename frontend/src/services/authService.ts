import type { AuthUser, UserRole } from '../types/models';
import { apiRequest, clearStoredToken, setStoredToken } from './http';

export interface LoginPayload {
  username: string;
  password: string;
  role: UserRole;
}

export async function login(payload: LoginPayload) {
  const result = await apiRequest<{ user: AuthUser; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setStoredToken(result.token);
  return result;
}

export async function me() {
  return apiRequest<{ user: AuthUser }>('/auth/me');
}

export function logout() {
  clearStoredToken();
}
