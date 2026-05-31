import { db } from '../database/connection.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolveDateRange, todayKey } from '../utils/dateRange.js';

export const dashboard = asyncHandler((_req, res) => {
  const today = todayKey();

  const todaySales = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue, COALESCE(SUM(profit), 0) as profit
    FROM transactions
    WHERE DATE(created_at) = DATE(@today)
  `).get({ today });

  const monthSales = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as revenue, COALESCE(SUM(profit), 0) as profit
    FROM transactions
    WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).get();

  const inventory = db.prepare(`
    SELECT
      SUM(CASE WHEN stock_quantity <= reorder_level AND active = 1 THEN 1 ELSE 0 END) as lowStock,
      SUM(CASE WHEN stock_quantity = 0 AND active = 1 THEN 1 ELSE 0 END) as outOfStock,
      COUNT(*) as productCount
    FROM products
  `).get();

  const topProducts = db.prepare(`
    SELECT
      ti.product_name as productName,
      SUM(ti.quantity) as quantitySold,
      SUM(ti.line_total) as revenue
    FROM transaction_items ti
    JOIN transactions t ON t.id = ti.transaction_id
    WHERE t.created_at >= datetime('now', '-30 days')
    GROUP BY ti.product_name
    ORDER BY quantitySold DESC
    LIMIT 8
  `).all();

  const employeePerformance = db.prepare(`
    SELECT
      u.id,
      u.name,
      COUNT(t.id) as transactionCount,
      COALESCE(SUM(t.total), 0) as revenue
    FROM users u
    LEFT JOIN transactions t ON t.employee_id = u.id AND t.created_at >= datetime('now', '-30 days')
    WHERE u.role = 'EMPLOYEE'
    GROUP BY u.id
    ORDER BY revenue DESC
    LIMIT 8
  `).all();

  const recentTransactions = db.prepare(`
    SELECT
      t.id,
      t.receipt_no as receiptNo,
      u.name as employeeName,
      t.total,
      t.payment_status as paymentStatus,
      t.created_at as createdAt
    FROM transactions t
    JOIN users u ON u.id = t.employee_id
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all();

  res.json({
    todaySales,
    monthSales,
    inventory,
    topProducts,
    employeePerformance,
    recentTransactions
  });
});

export const salesReport = asyncHandler((req, res) => {
  const { from, to } = resolveDateRange(req.query);

  const summary = db.prepare(`
    SELECT
      COUNT(*) as transactionCount,
      COALESCE(SUM(subtotal), 0) as subtotal,
      COALESCE(SUM(discount), 0) as discount,
      COALESCE(SUM(tax), 0) as tax,
      COALESCE(SUM(total), 0) as revenue,
      COALESCE(SUM(cost_total), 0) as costTotal,
      COALESCE(SUM(profit), 0) as grossProfit
    FROM transactions
    WHERE created_at BETWEEN @from AND @to
  `).get({ from, to });

  const expenses = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE expense_date BETWEEN @from AND @to
  `).get({ from, to }) as { total: number };

  const daily = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as transactionCount,
      COALESCE(SUM(total), 0) as revenue,
      COALESCE(SUM(profit), 0) as profit
    FROM transactions
    WHERE created_at BETWEEN @from AND @to
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all({ from, to });

  res.json({
    range: { from, to },
    summary: {
      ...(summary as object),
      expenses: expenses.total,
      netProfit: Number(((summary as { grossProfit: number }).grossProfit - expenses.total).toFixed(2))
    },
    daily
  });
});

export const productPerformance = asyncHandler((req, res) => {
  const { from, to } = resolveDateRange(req.query);

  const products = db.prepare(`
    SELECT
      ti.product_id as productId,
      ti.product_name as productName,
      SUM(ti.quantity) as quantitySold,
      SUM(ti.line_total) as revenue,
      SUM(ti.profit) as profit
    FROM transaction_items ti
    JOIN transactions t ON t.id = ti.transaction_id
    WHERE t.created_at BETWEEN @from AND @to
    GROUP BY ti.product_id, ti.product_name
    ORDER BY quantitySold DESC
  `).all({ from, to });

  const fastMoving = products.slice(0, 10);
  const slowMoving = db.prepare(`
    SELECT
      p.id as productId,
      p.name as productName,
      p.stock_quantity as stockQuantity,
      COALESCE(SUM(ti.quantity), 0) as quantitySold
    FROM products p
    LEFT JOIN transaction_items ti ON ti.product_id = p.id
    LEFT JOIN transactions t ON t.id = ti.transaction_id AND t.created_at BETWEEN @from AND @to
    WHERE p.active = 1
    GROUP BY p.id
    ORDER BY quantitySold ASC, p.stock_quantity DESC
    LIMIT 10
  `).all({ from, to });

  res.json({ range: { from, to }, products, fastMoving, slowMoving });
});

export const employeePerformanceReport = asyncHandler((req, res) => {
  const { from, to } = resolveDateRange(req.query);

  const employees = db.prepare(`
    SELECT
      u.id,
      u.name,
      u.username,
      COUNT(t.id) as transactionCount,
      COALESCE(SUM(t.total), 0) as revenue,
      COALESCE(SUM(t.profit), 0) as profit
    FROM users u
    LEFT JOIN transactions t ON t.employee_id = u.id AND t.created_at BETWEEN @from AND @to
    WHERE u.role = 'EMPLOYEE'
    GROUP BY u.id
    ORDER BY revenue DESC
  `).all({ from, to });

  res.json({ range: { from, to }, employees });
});
