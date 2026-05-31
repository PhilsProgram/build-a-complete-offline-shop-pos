import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Plus,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Users
} from 'lucide-react';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Input';
import { Table, Td, Th } from '../../components/ui/Table';

import { customerService } from '../../services/customerService';

import type { Customer, Debtor } from '../../types/models';

import { money, numberInput } from '../../utils/money';

export function DebtorsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [payments, setPayments] = useState<Record<number, number>>({});

  async function load() {
    const [customerResult, debtorResult] = await Promise.all([
      customerService.customers(),
      customerService.debtors()
    ]);

    setCustomers(customerResult.customers);
    setDebtors(debtorResult.debtors);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    await customerService.createCustomer({
      name: String(form.get('name')),
      phone: String(form.get('phone') ?? ''),
      email: String(form.get('email') ?? ''),
      address: String(form.get('address') ?? ''),
      notes: String(form.get('notes') ?? '')
    });

    event.currentTarget.reset();

    await load();
  }

  async function createDebt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    await customerService.createDebtor({
      customerId: Number(form.get('customerId')),
      amountDue: numberInput(form.get('amountDue')),
      amountPaid: numberInput(form.get('amountPaid')),
      dueDate: String(form.get('dueDate') ?? ''),
      notes: String(form.get('notes') ?? '')
    });

    event.currentTarget.reset();

    await load();
  }

  async function recordPayment(id: number) {
    const amount = payments[id] ?? 0;

    if (amount <= 0) return;

    await customerService.recordPayment(id, amount);

    setPayments((current) => ({
      ...current,
      [id]: 0
    }));

    await load();
  }

  const stats = useMemo(() => {
    const totalDebt = debtors.reduce(
      (sum, debt) => sum + debt.balance,
      0
    );

    const overdue = debtors.filter(
      (debt) => debt.status === 'OVERDUE'
    ).length;

    const paid = debtors.filter(
      (debt) => debt.status === 'PAID'
    ).length;

    return {
      totalDebt,
      overdue,
      paid,
      customers: customers.length
    };
  }, [debtors, customers]);

  return (
    <div className="grid gap-6">

      {/* HEADER */}

      <section className="rounded-3xl bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-100">
              Debtors Management
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Customer Credit & Debts
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-orange-100">
              Track balances, monitor overdue payments,
              manage customer credit, and record repayments.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-orange-100">
                <Wallet size={16} />
                <span className="text-xs">Outstanding</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {money(stats.totalDebt)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-orange-100">
                <AlertTriangle size={16} />
                <span className="text-xs">Overdue</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {stats.overdue}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-orange-100">
                <CheckCircle2 size={16} />
                <span className="text-xs">Paid</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {stats.paid}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-orange-100">
                <Users size={16} />
                <span className="text-xs">Customers</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {stats.customers}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">

        {/* LEFT SIDE */}

        <section className="grid gap-6">

          {/* CUSTOMER */}

          <form
            onSubmit={createCustomer}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-900 text-white">
                <Users size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Add Customer
                </h2>

                <p className="text-sm text-slate-500">
                  Create customer profile
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <Field label="Customer Name">
                <Input name="name" required />
              </Field>

              <Field label="Phone Number">
                <Input name="phone" />
              </Field>

              <Field label="Email Address">
                <Input name="email" />
              </Field>

              <Field label="Address">
                <Input name="address" />
              </Field>

              <Field label="Notes">
                <Textarea name="notes" />
              </Field>

              <Button type="submit" className="h-12">
                <Plus size={18} />
                Save Customer
              </Button>
            </div>
          </form>

          {/* CREATE DEBT */}

          <form
            onSubmit={createDebt}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500 text-white">
                <CreditCard size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Create Debt
                </h2>

                <p className="text-sm text-slate-500">
                  Record new customer debt
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <Field label="Customer">
                <Select name="customerId" required>
                  <option value="">Select customer</option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Amount Due">
                <Input
                  name="amountDue"
                  type="number"
                  step="0.01"
                  required
                />
              </Field>

              <Field label="Amount Paid">
                <Input
                  name="amountPaid"
                  type="number"
                  step="0.01"
                  defaultValue="0"
                />
              </Field>

              <Field label="Due Date">
                <Input
                  name="dueDate"
                  type="date"
                />
              </Field>

              <Field label="Notes">
                <Textarea name="notes" />
              </Field>

              <Button type="submit" className="h-12">
                <CreditCard size={18} />
                Save Debt
              </Button>
            </div>
          </form>
        </section>

        {/* TABLE */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black text-slate-900">
              Debtors List
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Monitor balances and collect repayments
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Receipt</Th>
                  <Th>Due</Th>
                  <Th>Paid</Th>
                  <Th>Balance</Th>
                  <Th>Status</Th>
                  <Th>Payment</Th>
                </tr>
              </thead>

              <tbody>
                {debtors.map((debt) => (
                  <tr
                    key={debt.id}
                    className={`transition hover:bg-slate-50 ${
                      debt.status === 'OVERDUE'
                        ? 'bg-rose-50/60'
                        : ''
                    }`}
                  >
                    <Td>
                      <div>
                        <p className="font-bold text-slate-800">
                          {debt.customerName}
                        </p>

                        <p className="text-xs text-slate-500">
                          {debt.customerPhone}
                        </p>
                      </div>
                    </Td>

                    <Td>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold">
                        {debt.receiptNo ?? 'Manual'}
                      </span>
                    </Td>

                    <Td>
                      <span className="font-semibold">
                        {money(debt.amountDue)}
                      </span>
                    </Td>

                    <Td>
                      <span className="text-emerald-700 font-semibold">
                        {money(debt.amountPaid)}
                      </span>
                    </Td>

                    <Td>
                      <span className="font-bold text-orange-600">
                        {money(debt.balance)}
                      </span>
                    </Td>

                    <Td>
                      <Badge
                        tone={
                          debt.status === 'PAID'
                            ? 'good'
                            : debt.status === 'OVERDUE'
                            ? 'bad'
                            : 'warn'
                        }
                      >
                        {debt.status}
                      </Badge>
                    </Td>

                    <Td>
                      <div className="flex min-w-56 gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={payments[debt.id] ?? ''}
                          onChange={(event) =>
                            setPayments((current) => ({
                              ...current,
                              [debt.id]: Number(event.target.value)
                            }))
                          }
                        />

                        <Button
                          type="button"
                          onClick={() =>
                            void recordPayment(debt.id)
                          }
                        >
                          Pay
                        </Button>
                      </div>
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