import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Wallet,
  CreditCard,
  Landmark,
  TrendingDown
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Table, Td, Th } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';

import { managementService } from '../../services/managementService';

import type { Expense } from '../../types/models';

import { shortDateTime } from '../../utils/dates';
import { money, numberInput } from '../../utils/money';

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  async function load() {
    const result = await managementService.expenses();
    setExpenses(result.expenses);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    await managementService.createExpense({
      category: String(form.get('category')),
      description: String(form.get('description')),
      amount: numberInput(form.get('amount')),
      paymentMethod: String(form.get('paymentMethod')),
      expenseDate: String(
        form.get('expenseDate') || new Date().toISOString()
      )
    });

    event.currentTarget.reset();

    await load();
  }

  async function remove(id: number) {
    const confirmDelete = window.confirm(
      'Delete this expense record?'
    );

    if (!confirmDelete) return;

    await managementService.deleteExpense(id);

    await load();
  }

  const stats = useMemo(() => {
    const total = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const cash = expenses
      .filter((e) => e.paymentMethod === 'CASH')
      .reduce((sum, expense) => sum + expense.amount, 0);

    const bank = expenses
      .filter(
        (e) =>
          e.paymentMethod === 'BANK' ||
          e.paymentMethod === 'CARD'
      )
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      total,
      cash,
      bank,
      count: expenses.length
    };
  }, [expenses]);

  return (
    <div className="grid gap-6">

      {/* HEADER */}

      <section className="rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-red-500 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-rose-100">
              Expense Management
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Business Expenses
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-rose-100">
              Monitor shop spending, operational costs,
              utility payments, and financial outflows.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-rose-100">
                <TrendingDown size={16} />
                <span className="text-xs">Total</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {money(stats.total)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-rose-100">
                <Wallet size={16} />
                <span className="text-xs">Cash</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {money(stats.cash)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-rose-100">
                <Landmark size={16} />
                <span className="text-xs">Bank/Card</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {money(stats.bank)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-rose-100">
                <CreditCard size={16} />
                <span className="text-xs">Records</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {stats.count}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">

        {/* FORM */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-rose-600 text-white">
              <Plus size={22} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">
                New Expense
              </h2>

              <p className="text-sm text-slate-500">
                Record operational spending
              </p>
            </div>
          </div>

          <form
            onSubmit={handleCreate}
            className="mt-6 grid gap-4"
          >
            <Field label="Expense Category">
              <Input
                name="category"
                required
                placeholder="Utilities"
              />
            </Field>

            <Field label="Description">
              <Input
                name="description"
                required
                placeholder="Electricity bill payment"
              />
            </Field>

            <Field label="Amount">
              <Input
                name="amount"
                type="number"
                step="0.01"
                required
              />
            </Field>

            <Field label="Payment Method">
              <Select
                name="paymentMethod"
                defaultValue="CASH"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="MOBILE_MONEY">
                  Mobile Money
                </option>
                <option value="BANK">Bank</option>
              </Select>
            </Field>

            <Field label="Expense Date">
              <Input
                name="expenseDate"
                type="datetime-local"
              />
            </Field>

            <Button type="submit" className="h-12">
              <Plus size={18} />
              Save Expense
            </Button>
          </form>
        </section>

        {/* TABLE */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black text-slate-900">
              Expense Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage all financial expenses
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Category</Th>
                  <Th>Description</Th>
                  <Th>Amount</Th>
                  <Th>Payment</Th>
                  <Th>Date</Th>
                  <Th>Action</Th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="transition hover:bg-slate-50"
                  >
                    <Td>
                      <div>
                        <p className="font-bold text-slate-800">
                          {expense.category}
                        </p>

                        <p className="text-xs text-slate-500">
                          Expense Record
                        </p>
                      </div>
                    </Td>

                    <Td>
                      <span className="text-slate-700">
                        {expense.description}
                      </span>
                    </Td>

                    <Td>
                      <span className="font-bold text-rose-600">
                        {money(expense.amount)}
                      </span>
                    </Td>

                    <Td>
                      <Badge
                        tone={
                          expense.paymentMethod === 'CASH'
                            ? 'warn'
                            : expense.paymentMethod ===
                              'BANK'
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        {expense.paymentMethod}
                      </Badge>
                    </Td>

                    <Td>
                      <span className="text-sm text-slate-600">
                        {shortDateTime(expense.expenseDate)}
                      </span>
                    </Td>

                    <Td>
                      <Button
                        type="button"
                        variant="danger"
                        className="h-10 w-10 px-0"
                        onClick={() =>
                          void remove(expense.id)
                        }
                        aria-label="Delete expense"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}