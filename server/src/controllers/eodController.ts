import { z } from 'zod';
import { db } from '../database/connection.js';
import { audit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { todayKey } from '../utils/dateRange.js';

const eodSchema = z.object({
  businessDate: z.string().trim().default(todayKey()),
  cashCounted: z.number().nonnegative().default(0),
  cardCounted: z.number().nonnegative().default(0),
  mobileCounted: z.number().nonnegative().default(0),
  notes: z.string().trim().optional().nullable()
});

function expectedForDate(date: string) {
  const payments = db.prepare(`
    SELECT p.method, COALESCE(SUM(p.amount), 0) as total
    FROM transaction_payments p
    JOIN transactions t ON t.id = p.transaction_id
    WHERE DATE(t.created_at) = DATE(@date)
      AND p.method IN ('CASH', 'CARD', 'MOBILE_MONEY')
    GROUP BY p.method
  `).all({ date }) as Array<{ method: string; total: number }>;

  const expenses = db.prepare(`
    SELECT
      COALESCE(SUM(amount), 0) as total,
      COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN amount ELSE 0 END), 0) as cashExpenses
    FROM expenses
    WHERE DATE(expense_date) = DATE(@date)
  `).get({ date }) as { total: number; cashExpenses: number };

  const byMethod = Object.fromEntries(payments.map((payment) => [payment.method, payment.total]));
  return {
    cashExpected: Number(((byMethod.CASH ?? 0) - expenses.cashExpenses).toFixed(2)),
    cardExpected: Number((byMethod.CARD ?? 0).toFixed(2)),
    mobileExpected: Number((byMethod.MOBILE_MONEY ?? 0).toFixed(2)),
    expensesTotal: Number(expenses.total.toFixed(2))
  };
}

export const getEodExpected = asyncHandler((req, res) => {
  const date = typeof req.query.date === 'string' ? req.query.date : todayKey();
  res.json({ businessDate: date, expected: expectedForDate(date) });
});

export const listEodRecords = asyncHandler((_req, res) => {
  const records = db.prepare(`
    SELECT
      e.id,
      e.business_date as businessDate,
      u.name as closedBy,
      e.cash_expected as cashExpected,
      e.cash_counted as cashCounted,
      e.card_expected as cardExpected,
      e.card_counted as cardCounted,
      e.mobile_expected as mobileExpected,
      e.mobile_counted as mobileCounted,
      e.expenses_total as expensesTotal,
      e.variance,
      e.notes,
      e.created_at as createdAt
    FROM eod_records e
    JOIN users u ON u.id = e.user_id
    ORDER BY e.business_date DESC
    LIMIT 90
  `).all();

  res.json({ records });
});

export const closeEod = asyncHandler((req, res) => {
  const input = eodSchema.parse(req.body);
  const expected = expectedForDate(input.businessDate);
  const expectedTotal = expected.cashExpected + expected.cardExpected + expected.mobileExpected;
  const countedTotal = input.cashCounted + input.cardCounted + input.mobileCounted;
  const variance = Number((countedTotal - expectedTotal).toFixed(2));

  const result = db.prepare(`
    INSERT INTO eod_records (
      user_id, business_date, cash_expected, cash_counted, card_expected, card_counted,
      mobile_expected, mobile_counted, expenses_total, variance, notes
    )
    VALUES (
      @userId, @businessDate, @cashExpected, @cashCounted, @cardExpected, @cardCounted,
      @mobileExpected, @mobileCounted, @expensesTotal, @variance, @notes
    )
    ON CONFLICT(business_date) DO UPDATE SET
      user_id = excluded.user_id,
      cash_expected = excluded.cash_expected,
      cash_counted = excluded.cash_counted,
      card_expected = excluded.card_expected,
      card_counted = excluded.card_counted,
      mobile_expected = excluded.mobile_expected,
      mobile_counted = excluded.mobile_counted,
      expenses_total = excluded.expenses_total,
      variance = excluded.variance,
      notes = excluded.notes
  `).run({
    userId: req.user?.id,
    businessDate: input.businessDate,
    cashExpected: expected.cashExpected,
    cashCounted: input.cashCounted,
    cardExpected: expected.cardExpected,
    cardCounted: input.cardCounted,
    mobileExpected: expected.mobileExpected,
    mobileCounted: input.mobileCounted,
    expensesTotal: expected.expensesTotal,
    variance,
    notes: input.notes ?? null
  });

  audit(req.user?.id, 'CLOSE', 'eod_records', Number(result.lastInsertRowid), { businessDate: input.businessDate, variance });
  res.status(201).json({ businessDate: input.businessDate, expected, variance });
});
