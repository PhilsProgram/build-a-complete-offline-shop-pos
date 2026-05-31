import {
  AlertTriangle,
  Boxes,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Users,
} from 'lucide-react';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Table, Td, Th } from '../../components/ui/Table';
import { useAsync } from '../../hooks/useAsync';
import { managementService } from '../../services/managementService';
import { shortDateTime } from '../../utils/dates';
import { money } from '../../utils/money';

export function DashboardPage() {
  const { data, loading, error } = useAsync(
    () => managementService.dashboard(),
    []
  );

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="rounded-3xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-emerald-100">
              Shop Management Dashboard
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Welcome Back 👋
            </h1>

            <p className="mt-3 max-w-2xl text-emerald-50">
              Monitor sales, stock levels, employee performance,
              debt tracking and overall business activity from one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-emerald-100">Today's Sales</p>
              <h2 className="mt-2 text-2xl font-black">
                {data.todaySales.count}
              </h2>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-emerald-100">Revenue</p>
              <h2 className="mt-2 text-2xl font-black">
                {money(data.todaySales.revenue)}
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Today's Revenue</p>
              <h2 className="mt-2 text-3xl font-black">
                {money(data.todaySales.revenue)}
              </h2>
            </div>

            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Wallet size={26} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Today's Profit</p>
              <h2 className="mt-2 text-3xl font-black">
                {money(data.todaySales.profit)}
              </h2>
            </div>

            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <DollarSign size={26} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Transactions</p>
              <h2 className="mt-2 text-3xl font-black">
                {data.todaySales.count}
              </h2>
            </div>

            <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
              <ShoppingCart size={26} />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Low Stock Items</p>
              <h2 className="mt-2 text-3xl font-black">
                {data.inventory.lowStock}
              </h2>
            </div>

            <div className="rounded-2xl bg-red-100 p-3 text-red-700">
              <AlertTriangle size={26} />
            </div>
          </div>
        </div>
      </section>

      {/* CHART + INVENTORY */}
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        {/* SALES CHART */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Sales Overview
              </p>

              <h2 className="text-2xl font-black text-slate-800">
                Top Selling Products
              </h2>
            </div>

            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <TrendingUp size={22} />
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts}>
                <XAxis
                  dataKey="productName"
                  tick={{ fontSize: 11 }}
                />

                <YAxis tick={{ fontSize: 11 }} />

                <Tooltip />

                <Bar
                  dataKey="quantitySold"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* INVENTORY PANEL */}
        <div className="space-y-5">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Inventory
                </p>

                <h2 className="text-2xl font-black">
                  Stock Status
                </h2>
              </div>

              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <Boxes size={22} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Total Products
                </p>

                <h2 className="mt-1 text-3xl font-black">
                  {data.inventory.productCount}
                </h2>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-sm text-amber-700">
                  Low Stock
                </p>

                <h2 className="mt-1 text-3xl font-black text-amber-800">
                  {data.inventory.lowStock}
                </h2>
              </div>

              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  Out Of Stock
                </p>

                <h2 className="mt-1 text-3xl font-black text-red-800">
                  {data.inventory.outOfStock}
                </h2>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-xl">
            <p className="text-sm text-slate-300">
              Monthly Revenue
            </p>

            <h2 className="mt-3 text-4xl font-black">
              {money(data.monthSales.revenue)}
            </h2>

            <p className="mt-2 text-slate-300">
              Profit: {money(data.monthSales.profit)}
            </p>
          </div>
        </div>
      </section>

      {/* TABLES */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* EMPLOYEES */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
              <Users size={20} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Staff Activity
              </p>

              <h2 className="text-2xl font-black">
                Employee Performance
              </h2>
            </div>
          </div>

          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Sales</Th>
                <Th>Revenue</Th>
              </tr>
            </thead>

            <tbody>
              {data.employeePerformance.map((employee) => (
                <tr key={employee.id}>
                  <Td>{employee.name}</Td>
                  <Td>{employee.transactionCount}</Td>
                  <Td>{money(employee.revenue)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* TRANSACTIONS */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5">
            <p className="text-sm text-slate-500">
              Latest Sales
            </p>

            <h2 className="text-2xl font-black">
              Recent Transactions
            </h2>
          </div>

          <Table>
            <thead>
              <tr>
                <Th>Receipt</Th>
                <Th>Employee</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>

            <tbody>
              {data.recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <Td>{transaction.receiptNo}</Td>
                  <Td>{transaction.employeeName}</Td>
                  <Td>{money(transaction.total)}</Td>

                  <Td>
                    <Badge
                      tone={
                        transaction.paymentStatus === 'PAID'
                          ? 'good'
                          : 'warn'
                      }
                    >
                      {transaction.paymentStatus}
                    </Badge>
                  </Td>

                  <Td>
                    {shortDateTime(transaction.createdAt)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>
    </div>
  );
}