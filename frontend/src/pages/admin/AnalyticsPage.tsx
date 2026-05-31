import { useEffect, useState } from "react";
import { money } from "../../utils/money";
import { dashboardService } from "../../services/dashboardServices";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { exportToExcel } from "../../utils/exportExcel";
import { exportEmployeesPdf } from "../../utils/exportPdf";

import { shortDateTime } from "../../utils/dates";
import { Button } from "../../components/ui/Button";

export function AnalyticsPage() {
  const [stats, setStats] = useState({
    sales: 0,
    profit: 0,
    transactions: 0,
    lowStock: 0,
  });

  const [topProducts, setTopProducts] = useState<
    Array<{
      name: string;
      sold: number;
    }>
  >([]);

  const [chartData, setChartData] = useState<
    Array<{
      date: string;
      sales: number;
    }>
  >([]);

  const [profitChartData, setProfitChartData] = useState<
    Array<{
      date: string;
      profit: number;
    }>
  >([]);

  const [topProfitProducts, setTopProfitProducts] = useState<
    Array<{
      name: string;
      profit: number;
    }>
  >([]);

  const [employees, setEmployees] = useState<
    Array<{
      id: number;
      name: string;
      transactions: number;
      sales: number;
      profit: number;
    }>
  >([]);

  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    dashboardService.stats().then((result) => {
      setStats(result.stats);
    });
    dashboardService.salesChart().then((result) => {
      setChartData(result.sales);
    });
    dashboardService.topProducts().then((result) => {
      setTopProducts(result.products);
    });
    dashboardService.recentActivity().then((result) => {
      setActivities(result.activities);
    });
    dashboardService.profitChart().then((result) => {
      setProfitChartData(result.profit);
    });
    dashboardService.topProfitProducts().then((result) => {
      setTopProfitProducts(result.products);
    });
    dashboardService.employeePerformance().then((result) => {
      setEmployees(result.employees);
    });
  }, []);

  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Analytics</h1>

          <p className="text-slate-500">
            Business insights and performance overview
          </p>
        </div>

        <Button
          onClick={() => {
            exportToExcel(
              employees.map((employee) => ({
                Employee: employee.name,
                Transactions: employee.transactions,
                Sales: employee.sales,
                Profit: employee.profit,
              })),
              "employee-performance-report",
            );
          }}
        >
          Export Excel
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            exportEmployeesPdf(employees);
          }}
        >
          Export PDF
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-md">
          <p className="text-sm text-slate-500">Sales Today</p>

          <h2 className="mt-2 text-3xl font-black text-till">
            {money(stats.sales, "GHS")}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-md">
          <p className="text-sm text-slate-500">Profit Today</p>

          <h2 className="mt-2 text-3xl font-black text-emerald-600">
            {money(stats.profit, "GHS")}
          </h2>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-md">
          <p className="text-sm text-slate-500">Transactions</p>

          <h2 className="mt-2 text-3xl font-black">{stats.transactions}</h2>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-md">
          <p className="text-sm text-slate-500">Low Stock</p>

          <h2 className="mt-2 text-3xl font-black text-amber-600">
            {stats.lowStock}
          </h2>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-md">
        <div className="mb-5">
          <h2 className="text-xl font-black">Sales Trend</h2>

          <p className="text-sm text-slate-500">Last 30 days revenue</p>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="date" />

              <YAxis />

              <Tooltip />

              <Line type="monotone" dataKey="sales" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-md">
        <div className="mb-5">
          <h2 className="text-xl font-black">Profit Trend</h2>

          <p className="text-sm text-slate-500">Last 30 days profit</p>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profitChartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="date" />

              <YAxis />

              <Tooltip />

              <Line type="monotone" dataKey="profit" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-md">
        <div className="mb-5">
          <h2 className="text-xl font-black">Top Selling Products</h2>

          <p className="text-sm text-slate-500">Most purchased items</p>
        </div>

        <div className="grid gap-3">
          {topProducts.map((product, index) => (
            <div
              key={product.name}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-till text-sm font-black text-white">
                  {index + 1}
                </div>

                <div>
                  <p className="font-bold">{product.name}</p>

                  <p className="text-sm text-slate-500">{product.sold} sold</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-md">
        <div className="mb-5">
          <h2 className="text-xl font-black">Most Profitable Products</h2>

          <p className="text-sm text-slate-500">Highest earning products</p>
        </div>

        <div className="grid gap-3">
          {topProfitProducts.map((product, index) => (
            <div
              key={product.name}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-sm font-black text-white">
                  {index + 1}
                </div>

                <div>
                  <p className="font-bold">{product.name}</p>
                </div>
              </div>

              <strong className="text-emerald-600">
                {money(product.profit, "GHS")}
              </strong>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-md">
        <div className="mb-5">
          <h2 className="text-xl font-black">Recent Activity</h2>

          <p className="text-sm text-slate-500">Latest store activity</p>
        </div>

        <div className="grid gap-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start justify-between rounded-2xl border border-slate-200 p-4"
            >
              <div>
                <p className="font-bold">{activity.userName ?? "System"}</p>

                <p className="text-sm text-slate-600">
                  {activity.type === "SALE"
                    ? `${activity.message} • ${money(activity.amount, "GHS")}`
                    : `${activity.message} • ${activity.productName} (${activity.amount > 0 ? "+" : ""}${activity.amount})`}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {shortDateTime(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-md">
        <div className="mb-5">
          <h2 className="text-xl font-black">Employee Performance</h2>

          <p className="text-sm text-slate-500">
            Staff sales and profit contribution
          </p>
        </div>

        <div className="grid gap-3">
          {employees.map((employee, index) => (
            <div
              key={employee.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-till text-sm font-black text-white">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-bold">{employee.name}</p>

                    <p className="text-sm text-slate-500">
                      {employee.transactions} transactions
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-till">
                    {money(employee.sales, "GHS")}
                  </p>

                  <p className="text-sm text-emerald-600">
                    Profit: {money(employee.profit, "GHS")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
