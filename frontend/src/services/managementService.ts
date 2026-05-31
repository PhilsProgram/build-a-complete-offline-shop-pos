import type { AuthUser, DashboardData, Expense } from '../types/models';
import {
  apiRequest,
  getStoredToken,
  API_BASE_URL
} from './http';

export const managementService = {
  dashboard() {
    return apiRequest<DashboardData>('/reports/dashboard');
  },
  users() {
    return apiRequest<{ users: AuthUser[] }>('/users');
  },
  createUser(payload: { name: string; username: string; password: string; role: 'ADMIN' | 'EMPLOYEE'; active: boolean }) {
    return apiRequest<{ id: number }>('/users', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateUser(id: number, payload: Partial<{ name: string; username: string; role: 'ADMIN' | 'EMPLOYEE'; active: boolean }>) {
    return apiRequest<{ id: number }>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  resetPassword(id: number, password: string) {
    return apiRequest<{ id: number }>(`/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) });
  },
  deleteUser(id: number) {
    return apiRequest<void>(`/users/${id}`, { method: 'DELETE' });
  },
  expenses() {
    return apiRequest<{ expenses: Expense[] }>('/expenses');
  },
  createExpense(payload: { category: string; description: string; amount: number; paymentMethod: string; expenseDate?: string }) {
    return apiRequest<{ id: number }>('/expenses', { method: 'POST', body: JSON.stringify(payload) });
  },
  deleteExpense(id: number) {
    return apiRequest<void>(`/expenses/${id}`, { method: 'DELETE' });
  },
  salesReport(from: string, to: string) {
    return apiRequest<{ range: { from: string; to: string }; summary: Record<string, number>; daily: Array<Record<string, number | string>> }>(`/reports/sales?from=${from}&to=${to}`);
  },
  productReport(from: string, to: string) {
    return apiRequest<{ products: Array<Record<string, number | string>>; fastMoving: Array<Record<string, number | string>>; slowMoving: Array<Record<string, number | string>> }>(`/reports/products?from=${from}&to=${to}`);
  },
  employeeReport(from: string, to: string) {
    return apiRequest<{ employees: Array<Record<string, number | string>> }>(`/reports/employees?from=${from}&to=${to}`);
  },
  eodExpected(date: string) {
    return apiRequest<{ businessDate: string; expected: { cashExpected: number; cardExpected: number; mobileExpected: number; expensesTotal: number } }>(`/eod/expected?date=${date}`);
  },
  eodRecords() {
    return apiRequest<{ records: Array<Record<string, number | string | null>> }>('/eod');
  },
  closeEod(payload: { businessDate: string; cashCounted: number; cardCounted: number; mobileCounted: number; notes?: string }) {
    return apiRequest<{ variance: number }>('/eod', { method: 'POST', body: JSON.stringify(payload) });
  },
  settings() {
    return apiRequest<{ settings: Record<string, string | number | boolean | null> }>('/settings');
  },
  updateSettings(settings: Record<string, string | number | boolean | null>) {
    return apiRequest<{ settings: Record<string, string | number | boolean | null> }>('/settings', { method: 'PUT', body: JSON.stringify(settings) });
  },
  backups() {
    return apiRequest<{ backups: Array<{ file: string; kind: 'manual' | 'auto' | 'unknown'; size: number; createdAt: string }> }>('/backups');
  },
  
  async exportBackup() {
  const token = getStoredToken();

  const response = await fetch(
    `${API_BASE_URL}/backups/export`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Backup export failed.");
  }

  return response.blob();
},
  restoreBackup(file: File) {
    const body = new FormData();
    body.set('database', file);
    return apiRequest<{ message: string }>('/backups/restore', { method: 'POST', body });
  }
};
