export type UserRole = "ADMIN" | "EMPLOYEE";

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  active: boolean | number;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
}

export interface Product {
  id: number;
  sku?: string | null;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  imageUrl?: string | null;
  price: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  active: boolean | number;
  unitsPerPack: number;
  allowSplitSales: boolean | number;
  profitMargin?: number;
  isFavorite?: boolean | number;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  balance?: number;
}

export interface Debtor {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone?: string | null;
  receiptNo?: string | null;
  amountDue: number;
  amountPaid: number;
  balance: number;
  dueDate?: string | null;
  status: "OPEN" | "PARTIAL" | "PAID" | "OVERDUE";
  notes?: string | null;
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  expenseDate: string;
  recordedByName: string;
}

export interface TransactionPayment {
  id: number;
  method: PaymentMethod;
  amount: number;
  reference?: string | null;
}

export interface TransactionItem {
  id: number;
  productId?: number | null;
  productName: string;
  quantity: number;
  imageUrl?: string | null;
  unitPrice: number;
  unitCost: number;
  discount: number;
  lineTotal: number;
  profit: number;
  saleType: "PACK" | "HALF" | "SINGLE";
}

export interface Transaction {
  id: number;
  receiptNo: string;
  customerId?: number | null;
  customerName?: string | null;
  employeeId: number;
  employeeName: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  costTotal: number;
  profit: number;
  paymentMethod: string;
  paymentStatus: string;
  cashReceived: number;
  changeDue: number;
  notes?: string | null;
  createdAt: string;
  items?: TransactionItem[];
  payments?: TransactionPayment[];
}

export type PaymentMethod = "CASH" | "CARD" | "MOBILE_MONEY" | "DEBT" | "SPLIT";

export interface CartLine {
  product: Product;
  quantity: number;
  discount: number;
  saleType?: "PACK" | "HALF" | "SINGLE";
}

export interface DashboardData {
  todaySales: { count: number; revenue: number; profit: number };
  monthSales: { revenue: number; profit: number };
  inventory: { lowStock: number; outOfStock: number; productCount: number };
  topProducts: Array<{
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
  employeePerformance: Array<{
    id: number;
    name: string;
    transactionCount: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: number;
    receiptNo: string;
    employeeName: string;
    total: number;
    paymentStatus: string;
    createdAt: string;
  }>;
}
