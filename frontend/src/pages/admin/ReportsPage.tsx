import { FormEvent, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';
import { StatCard } from '../../components/ui/StatCard';
import { Table, Td, Th } from '../../components/ui/Table';
import { managementService } from '../../services/managementService';
import { todayDateInput } from '../../utils/dates';
import { money } from '../../utils/money';

export function ReportsPage() {
  const today = todayDateInput();
  const [sales, setSales] = useState<{ summary: Record<string, number>; daily: Array<Record<string, number | string>> } | null>(null);
  const [products, setProducts] = useState<Array<Record<string, number | string>>>([]);
  const [employees, setEmployees] = useState<Array<Record<string, number | string>>>([]);

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const from = `${form.get('from')}T00:00:00.000Z`;
    const to = `${form.get('to')}T23:59:59.999Z`;
    const [salesResult, productResult, employeeResult] = await Promise.all([
      managementService.salesReport(from, to),
      managementService.productReport(from, to),
      managementService.employeeReport(from, to)
    ]);
    setSales(salesResult);
    setProducts(productResult.products);
    setEmployees(employeeResult.employees);
  }

  return (
  <div className="grid gap-6">
    {/* HERO */}
    <section className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 p-6 text-white shadow-2xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-200">
            Business Intelligence & Analytics
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Reports Center
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Analyze revenue, employee performance, profit trends,
            expenses, and product movement across your business.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-slate-300">
              Revenue
            </p>

            <h3 className="mt-1 text-xl font-black">
              {money(sales?.summary.revenue ?? 0)}
            </h3>
          </div>

          <div className="rounded-2xl bg-emerald-500/20 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-emerald-100">
              Net Profit
            </p>

            <h3 className="mt-1 text-xl font-black">
              {money(sales?.summary.netProfit ?? 0)}
            </h3>
          </div>

          <div className="rounded-2xl bg-amber-500/20 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-amber-100">
              Expenses
            </p>

            <h3 className="mt-1 text-xl font-black">
              {money(sales?.summary.expenses ?? 0)}
            </h3>
          </div>

          <div className="rounded-2xl bg-cyan-500/20 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wide text-cyan-100">
              Products
            </p>

            <h3 className="mt-1 text-xl font-black">
              {products.length}
            </h3>
          </div>
        </div>
      </div>
    </section>

    {/* FILTER */}
    <form
      onSubmit={(event) => void run(event)}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <Field label="From">
          <Input
            name="from"
            type="date"
            defaultValue={today}
            className="h-12 rounded-2xl"
          />
        </Field>

        <Field label="To">
          <Input
            name="to"
            type="date"
            defaultValue={today}
            className="h-12 rounded-2xl"
          />
        </Field>

        <Button
          className="h-12 rounded-2xl px-6"
          type="submit"
        >
          <BarChart3 size={18} />
          Run Reports
        </Button>
      </div>
    </form>

    {/* STATS */}
    {sales && (
      <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <p className="text-sm font-medium text-slate-500">
              Total Revenue
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              {money(sales.summary.revenue)}
            </h2>

            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-[85%] rounded-full bg-indigo-600" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <p className="text-sm font-medium text-slate-500">
              Gross Profit
            </p>

            <h2 className="mt-3 text-3xl font-black text-emerald-600">
              {money(sales.summary.grossProfit)}
            </h2>

            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-[70%] rounded-full bg-emerald-500" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <p className="text-sm font-medium text-slate-500">
              Expenses
            </p>

            <h2 className="mt-3 text-3xl font-black text-amber-600">
              {money(sales.summary.expenses)}
            </h2>

            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-[45%] rounded-full bg-amber-500" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <p className="text-sm font-medium text-slate-500">
              Net Profit
            </p>

            <h2 className="mt-3 text-3xl font-black text-cyan-600">
              {money(sales.summary.netProfit)}
            </h2>

            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-[75%] rounded-full bg-cyan-500" />
            </div>
          </div>
        </section>

        {/* CHART */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Daily Sales
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Revenue generated over the selected period
              </p>
            </div>

            <div className="rounded-2xl bg-indigo-100 p-3">
              <BarChart3
                size={22}
                className="text-indigo-700"
              />
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sales.daily}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                />

                <YAxis tick={{ fontSize: 11 }} />

                <Tooltip />

                <Bar
                  dataKey="revenue"
                  fill="#4f46e5"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </>
    )}

    {/* TABLES */}
    <section className="grid gap-6 xl:grid-cols-2">
      {/* PRODUCTS */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-2xl font-black text-slate-900">
            Product Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Best performing products and profits
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <Th>Product</Th>
                <Th>Qty</Th>
                <Th>Revenue</Th>
                <Th>Profit</Th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr
                  key={String(product.productName)}
                  className="transition hover:bg-slate-50"
                >
                  <Td>
                    <div className="font-semibold text-slate-800">
                      {String(product.productName)}
                    </div>
                  </Td>

                  <Td>
                    <span className="rounded-xl bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                      {String(product.quantitySold ?? 0)}
                    </span>
                  </Td>

                  <Td>
                    <span className="font-bold text-slate-900">
                      {money(Number(product.revenue ?? 0))}
                    </span>
                  </Td>

                  <Td>
                    <span className="font-bold text-emerald-600">
                      {money(Number(product.profit ?? 0))}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* EMPLOYEES */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-2xl font-black text-slate-900">
            Employee Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track staff sales and generated profits
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <Th>Name</Th>
                <Th>Sales</Th>
                <Th>Revenue</Th>
                <Th>Profit</Th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr
                  key={String(employee.id)}
                  className="transition hover:bg-slate-50"
                >
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                        {String(employee.name)
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <span className="font-semibold text-slate-800">
                        {String(employee.name)}
                      </span>
                    </div>
                  </Td>

                  <Td>
                    <span className="rounded-xl bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                      {String(employee.transactionCount ?? 0)}
                    </span>
                  </Td>

                  <Td>
                    <span className="font-bold text-slate-900">
                      {money(Number(employee.revenue ?? 0))}
                    </span>
                  </Td>

                  <Td>
                    <span className="font-bold text-emerald-600">
                      {money(Number(employee.profit ?? 0))}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </section>
  </div>
);
}
