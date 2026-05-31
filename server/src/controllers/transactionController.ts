import { z } from "zod";
import { db } from "../database/connection.js";
import { ApiError } from "../utils/ApiError.js";
import { audit } from "../utils/audit.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const transactionItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  discount: z.number().nonnegative().default(0),
});

const paymentSchema = z.object({
  method: z.enum(["CASH", "CARD", "MOBILE_MONEY", "DEBT", "SPLIT"]),
  amount: z.number().nonnegative(),
  reference: z.string().trim().optional().nullable(),
});

const createTransactionSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  items: z.array(transactionItemSchema).min(1),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  payments: z.array(paymentSchema).min(1),
  notes: z.string().trim().optional().nullable(),
  debtDueDate: z.string().trim().optional().nullable(),
});

interface ProductRow {
  id: number;
  name: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  active: number;
}

interface TransactionRow {
  id: number;
  receiptNo: string;
  employeeId: number;
  [key: string]: unknown;
}

function generateReceiptNo() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `POS-${stamp}-${suffix}`;
}

function getTransactionById(id: number) {
  const transaction = db
    .prepare(
      `
    SELECT
      t.id,
      t.receipt_no as receiptNo,
      t.customer_id as customerId,
      c.name as customerName,
      t.employee_id as employeeId,
      u.name as employeeName,
      t.subtotal,
      t.discount,
      t.tax,
      t.total,
      t.cost_total as costTotal,
      t.profit,
      t.payment_method as paymentMethod,
      t.payment_status as paymentStatus,
      t.cash_received as cashReceived,
      t.change_due as changeDue,
      t.notes,
      t.created_at as createdAt
    FROM transactions t
    LEFT JOIN customers c ON c.id = t.customer_id
    JOIN users u ON u.id = t.employee_id
    WHERE t.id = ?
  `,
    )
    .get(id) as TransactionRow | undefined;

  if (!transaction) {
    return undefined;
  }

  const items = db
    .prepare(
      `
    SELECT
      id,
      product_id as productId,
      product_name as productName,
      quantity,
      unit_price as unitPrice,
      unit_cost as unitCost,
      discount,
      line_total as lineTotal,
      profit
    FROM transaction_items
    WHERE transaction_id = ?
    ORDER BY id ASC
  `,
    )
    .all(id);

  const payments = db
    .prepare(
      `
    SELECT id, method, amount, reference, created_at as createdAt
    FROM transaction_payments
    WHERE transaction_id = ?
    ORDER BY id ASC
  `,
    )
    .all(id);

  return { ...transaction, items, payments };
}

export const createTransaction = asyncHandler((req, res) => {
  const input = createTransactionSchema.parse(req.body);
  const employeeId = req.user?.id;

  if (!employeeId) {
    res.status(401).json({ message: "Authentication is required." });
    return;
  }

  const result = db.transaction(() => {
    const preparedItems = input.items.map((item) => {
      const product = db
        .prepare(
          `
        SELECT id, name, price, cost_price, stock_quantity, active
        FROM products
        WHERE id = ?
      `,
        )
        .get(item.productId) as ProductRow | undefined;

      if (!product || !product.active) {
        throw new ApiError(400, `Product ${item.productId} is unavailable.`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new ApiError(
          400,
          `${product.name} has only ${product.stock_quantity} in stock.`,
        );
      }

      const gross = product.price * item.quantity;
      const lineDiscount = Math.min(item.discount, gross);
      const lineTotal = Number((gross - lineDiscount).toFixed(2));
      const lineCost = product.cost_price * item.quantity;
      const profit = Number((lineTotal - lineCost).toFixed(2));

      return {
        product,
        quantity: item.quantity,
        discount: lineDiscount,
        lineTotal,
        profit,
      };
    });

    const subtotal = Number(
      preparedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
    );
    const discount = Math.min(input.discount, subtotal);
    const tax = input.tax;
    const total = Number(Math.max(subtotal - discount + tax, 0).toFixed(2));
    const costTotal = Number(
      preparedItems
        .reduce((sum, item) => sum + item.product.cost_price * item.quantity, 0)
        .toFixed(2),
    );
    const profit = Number((total - costTotal).toFixed(2));
    const paidAmount = Number(
      input.payments
        .filter((payment) => payment.method !== "DEBT")
        .reduce((sum, payment) => sum + payment.amount, 0)
        .toFixed(2),
    );
    const debtAmount = Number(Math.max(total - paidAmount, 0).toFixed(2));
    const paymentStatus =
      debtAmount > 0 ? (paidAmount > 0 ? "PARTIAL" : "DEBT") : "PAID";

    if (debtAmount > 0 && !input.customerId) {
      throw new ApiError(
        400,
        "Customer is required for debt or partial payment transactions.",
      );
    }

    const paymentMethod =
      input.payments.length > 1
        ? "SPLIT"
        : (input.payments[0]?.method ?? "CASH");
    const cashReceived = Number(
      input.payments
        .filter((payment) => payment.method === "CASH")
        .reduce((sum, payment) => sum + payment.amount, 0)
        .toFixed(2),
    );
    const changeDue = Number(Math.max(paidAmount - total, 0).toFixed(2));

    const transactionResult = db
      .prepare(
        `
      INSERT INTO transactions (
        receipt_no, customer_id, employee_id, subtotal, discount, tax, total,
        cost_total, profit, payment_method, payment_status, cash_received, change_due, notes
      )
      VALUES (
        @receiptNo, @customerId, @employeeId, @subtotal, @discount, @tax, @total,
        @costTotal, @profit, @paymentMethod, @paymentStatus, @cashReceived, @changeDue, @notes
      )
    `,
      )
      .run({
        receiptNo: generateReceiptNo(),
        customerId: input.customerId ?? null,
        employeeId,
        subtotal,
        discount,
        tax,
        total,
        costTotal,
        profit,
        paymentMethod,
        paymentStatus,
        cashReceived,
        changeDue,
        notes: input.notes ?? null,
      });

    const transactionId = Number(transactionResult.lastInsertRowid);
    const insertItem = db.prepare(`
      INSERT INTO transaction_items (
        transaction_id, product_id, product_name, quantity, unit_price, unit_cost,
        discount, line_total, profit
      )
      VALUES (
        @transactionId, @productId, @productName, @quantity, @unitPrice, @unitCost,
        @discount, @lineTotal, @profit
      )
    `);
    const decrementStock = db.prepare(
      "UPDATE products SET stock_quantity = stock_quantity - @quantity WHERE id = @productId",
    );

    preparedItems.forEach((item) => {
      insertItem.run({
        transactionId,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        unitCost: item.product.cost_price,
        discount: item.discount,
        lineTotal: item.lineTotal,
        profit: item.profit,
      });
      decrementStock.run({
        productId: item.product.id,
        quantity: item.quantity,
      });
    });

    const insertPayment = db.prepare(`
      INSERT INTO transaction_payments (transaction_id, method, amount, reference)
      VALUES (@transactionId, @method, @amount, @reference)
    `);

    input.payments.forEach((payment) => {
      insertPayment.run({
        transactionId,
        method: payment.method,
        amount: payment.amount,
        reference: payment.reference ?? null,
      });
    });

    if (
      debtAmount > 0 &&
      !input.payments.some((payment) => payment.method === "DEBT")
    ) {
      insertPayment.run({
        transactionId,
        method: "DEBT",
        amount: debtAmount,
        reference: null,
      });
    }

    if (debtAmount > 0 && input.customerId) {
      db.prepare(
        `
        INSERT INTO debtors (customer_id, transaction_id, amount_due, amount_paid, due_date, status, notes)
        VALUES (@customerId, @transactionId, @amountDue, @amountPaid, @dueDate, @status, @notes)
      `,
      ).run({
        customerId: input.customerId,
        transactionId,
        amountDue: debtAmount,
        amountPaid: 0,
        dueDate: input.debtDueDate ?? null,
        status: "OPEN",
        notes: input.notes ?? null,
      });
    }

    return transactionId;
  })();

  audit(req.user?.id, "CREATE", "transactions", result);
  res.status(201).json({ transaction: getTransactionById(result) });
});

export const listTransactions = asyncHandler((req, res) => {
  const search = typeof req.query.search === "string" ? `%${req.query.search}%` : null;

  const from = typeof req.query.from === "string" ? req.query.from : null;

  const to = typeof req.query.to === "string" ? req.query.to : null;

  const employeeId =
    String(req.user?.role) === 'ADMIN'
      ? req.query.employeeId
        ? Number(req.query.employeeId)
        : null
      : req.user?.id ?? null;

  const transactions = db
    .prepare(
      `
    SELECT
      t.id,
      t.receipt_no as receiptNo,
      c.name as customerName,
      u.name as employeeName,
      t.total,
      t.profit,
      t.payment_method as paymentMethod,
      t.payment_status as paymentStatus,
      t.created_at as createdAt
    FROM transactions t
    LEFT JOIN customers c ON c.id = t.customer_id
    JOIN users u ON u.id = t.employee_id
    WHERE (@search IS NULL OR t.receipt_no LIKE @search OR c.name LIKE @search OR u.name LIKE @search)
      AND (@from IS NULL OR t.created_at >= @from)
      AND (@to IS NULL OR t.created_at <= @to)
      AND (@employeeId IS NULL OR t.employee_id = @employeeId)
    ORDER BY t.created_at DESC
    LIMIT 250
  `,
    )
    .all({
      search,
      from,
      to,
      employeeId,
    });

  res.json({ transactions });
});

export const getTransaction = asyncHandler((req, res) => {
  const transaction = getTransactionById(Number(req.params.id));

  if (!transaction) {
    res.status(404).json({ message: "Transaction not found." });
    return;
  }

  if (
    req.user?.role === "EMPLOYEE" &&
    (transaction as { employeeId: number }).employeeId !== req.user.id
  ) {
    res
      .status(403)
      .json({ message: "Employees can only view their own receipt records." });
    return;
  }

  res.json({ transaction });
});
