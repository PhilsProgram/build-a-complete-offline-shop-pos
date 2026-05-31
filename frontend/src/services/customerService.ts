import type { Customer, Debtor } from '../types/models';
import { apiRequest } from './http';

export const customerService = {
  customers(search = '') {
    return apiRequest<{ customers: Customer[] }>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  },
  createCustomer(payload: Omit<Customer, 'id' | 'balance'>) {
    return apiRequest<{ id: number }>('/customers', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateCustomer(id: number, payload: Partial<Omit<Customer, 'id' | 'balance'>>) {
    return apiRequest<{ id: number }>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  debtors(status = '') {
    return apiRequest<{ debtors: Debtor[] }>(`/customers/debtors/list${status ? `?status=${status}` : ''}`);
  },
  createDebtor(payload: { customerId: number; amountDue: number; amountPaid: number; dueDate?: string; notes?: string }) {
    return apiRequest<{ id: number }>('/customers/debtors', { method: 'POST', body: JSON.stringify(payload) });
  },
  recordPayment(id: number, amount: number) {
    return apiRequest<{ id: number; amountPaid: number; status: string }>(`/customers/debtors/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ amount })
    });
  },
  deleteDebtor(id: number) {
    return apiRequest<void>(`/customers/debtors/${id}`, { method: 'DELETE' });
  }
};
