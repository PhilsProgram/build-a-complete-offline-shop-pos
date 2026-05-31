export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  active: boolean;
}

export interface JwtUserPayload {
  id: number;
  username: string;
  role: UserRole;
}

export interface ProductSaleInput {
  productId: number;
  quantity: number;
  discount?: number;
  isFavorite?: number;
}

export interface PaymentInput {
  method: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'DEBT' | 'SPLIT';
  amount: number;
  reference?: string;
}
