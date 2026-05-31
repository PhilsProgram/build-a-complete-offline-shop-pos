import type { PaymentMethod, Transaction } from '../types/models';
import { apiRequest } from './http';

export interface CheckoutPayload {
  customerId?: number | null;
  items: Array<{ productId: number; quantity: number; discount: number }>;
  discount: number;
  tax: number;
  payments: Array<{ method: PaymentMethod; amount: number; reference?: string }>;
  notes?: string;
  debtDueDate?: string;
}

export const transactionService = {
  checkout(payload: CheckoutPayload) {
    return apiRequest<{ transaction: Transaction }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  transactions(search = '') {
    return apiRequest<{ transactions: Transaction[] }>(`/transactions${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  },
  transaction(id: number) {
    return apiRequest<{ transaction: Transaction }>(`/transactions/${id}`);
  }
};
