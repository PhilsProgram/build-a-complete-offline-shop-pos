import { apiRequest } from "./http.js";

export const dashboardService = {
  stats() {
    return apiRequest<{
      stats: {
        sales: number;
        profit: number;
        transactions: number;
        lowStock: number;
      };
    }>("/dashboard/stats");
  },

  salesChart() {
    return apiRequest<{
      sales: Array<{
        date: string;
        sales: number;
      }>;
    }>("/dashboard/sales-chart");
  },

  topProducts() {
    return apiRequest<{
      products: Array<{
        name: string;
        sold: number;
      }>;
    }>("/dashboard/top-products");
  },

  recentActivity() {
    return apiRequest<{
      activities: any[];
    }>("/dashboard/recent-activity");
  },

  profitChart() {
    return apiRequest<{
      profit: Array<{
        date: string;
        profit: number;
      }>;
    }>("/dashboard/profit-chart");
  },

  topProfitProducts() {
    return apiRequest<{
      products: Array<{
        name: string;
        profit: number;
      }>;
    }>("/dashboard/top-profit-products");
  },

  employeePerformance() {
    return apiRequest<{
      employees: Array<{
        id: number;
        name: string;
        transactions: number;
        sales: number;
        profit: number;
      }>;
    }>("/dashboard/employee-performance");
  },
};
