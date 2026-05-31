import { Router } from "express";
import {
  salesChart,
  topProducts,
  recentActivity,
  profitChart,
  topProfitProducts,
  employeePerformance,
} from "../controllers/dashboardController.js";

const dashboardRoutes = Router();

dashboardRoutes.get("/sales-chart", salesChart);
dashboardRoutes.get("/top-products", topProducts);
dashboardRoutes.get("/recent-activity", recentActivity);
dashboardRoutes.get("/profit-chart", profitChart);
dashboardRoutes.get("/top-profit-products", topProfitProducts);
dashboardRoutes.get("/employee-performance", employeePerformance);
