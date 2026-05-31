import { db } from "../database/connection.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const salesChart = asyncHandler((req, res) => {
  const sales = db.prepare(`
    SELECT
      DATE(created_at) as date,
      SUM(total) as sales
    FROM transactions
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
    LIMIT 30
  `).all();

  res.json({ sales });
});

export const topProducts = asyncHandler((req, res) => {
  const products = db.prepare(`
    SELECT
      p.name,
      SUM(ti.quantity) as sold
    FROM transaction_items ti
    JOIN products p ON p.id = ti.product_id
    GROUP BY ti.product_id
    ORDER BY sold DESC
    LIMIT 5
  `).all();

  res.json({ products });
});

export const recentActivity = asyncHandler((req, res) => {
  const sales = db.prepare(`
    SELECT
      'SALE' as type,
      t.id,
      t.total as amount,
      u.name as userName,
      t.created_at as createdAt,
      'Completed sale' as message
    FROM transactions t
    JOIN users u ON u.id = t.employee_id
  `).all();

  const stockMovements = db.prepare(`
    SELECT
      'STOCK' as type,
      sm.id,
      sm.quantity as amount,
      u.name as userName,
      sm.created_at as createdAt,
      p.name as productName,
      sm.type as message
    FROM stock_movements sm
    LEFT JOIN users u ON u.id = sm.user_id
    JOIN products p ON p.id = sm.product_id
  `).all();

  const activities = [
    ...sales,
    ...stockMovements,
  ]
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 15);

  res.json({ activities });
});

export const profitChart = asyncHandler((req, res) => {
  const profit = db.prepare(`
    SELECT
      DATE(created_at) as date,
      SUM(profit) as profit
    FROM transactions
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
    LIMIT 30
  `).all();

  res.json({ profit });
});

export const topProfitProducts = asyncHandler((req, res) => {
  const products = db.prepare(`
    SELECT
      p.name,
      SUM(
        (ti.price - ti.cost_price)
        * ti.quantity
      ) as profit
    FROM transaction_items ti
    JOIN products p ON p.id = ti.product_id
    GROUP BY ti.product_id
    ORDER BY profit DESC
    LIMIT 5
  `).all();

  res.json({ products });
});

export const employeePerformance = asyncHandler((req, res) => {
  const employees = db.prepare(`
    SELECT
      u.id,
      u.name,
      COUNT(t.id) as transactions,
      COALESCE(SUM(t.total), 0) as sales,
      COALESCE(SUM(t.profit), 0) as profit
    FROM users u
    LEFT JOIN transactions t
      ON t.employee_id = u.id
    GROUP BY u.id
    ORDER BY sales DESC
    LIMIT 10
  `).all();

  res.json({ employees });
});