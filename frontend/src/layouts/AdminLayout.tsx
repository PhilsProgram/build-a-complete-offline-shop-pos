import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  ClipboardCheck,
  CreditCard,
  DatabaseBackup,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { APP_AUTHOR, APP_NAME,APP_VERSION } from "../config/app";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Boxes },
  { to: "/admin/employees", label: "Employees", icon: Users },
  { to: "/admin/debtors", label: "Debtors", icon: CreditCard },
  { to: "/admin/expenses", label: "Expenses", icon: BriefcaseBusiness },
  { to: "/admin/transactions", label: "Transactions", icon: ReceiptText },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/eod", label: "EOD", icon: ClipboardCheck },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/backup", label: "Backup", icon: DatabaseBackup },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="flex min-h-screen flex-col border-r border-slate-200/70 bg-white shadow-xl shadow-slate-200/40">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Admin Panel
            </p>

            <div className="flex items-center gap-3">
              <img
                src="/backgroundImage.png"
                alt="Logo"
                className="h-10 w-10 rounded-xl object-cover"
              />

              <div>
                <p className="text-xs font-bold uppercase text-till">Admin</p>

                <h1 className="text-lg font-black">Shop Manager</h1>
              </div>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Business control center
            </p>
          </div>

          <Button
            variant="ghost"
            className="h-11 w-11 rounded-xl lg:hidden"
            onClick={() => navigate("/pos")}
            aria-label="Open POS"
          >
            <ShoppingCart size={18} />
          </Button>
        </div>

        <nav className="grid gap-2 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  location.pathname === item.to
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500 group-hover:bg-white"
                }`}
              >
                <item.icon size={18} />
              </div>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        {/* APP VERSION */}
        <div className="mt-auto border-t border-slate-200 px-4 py-5 text-center">
  <div className="font-black text-slate-800">
    {APP_NAME}
  </div>

  <div className="mt-1 text-xs font-medium text-slate-500">
    Version {APP_VERSION}
  </div>

  <div className="mt-2 text-[10px] font-semibold tracking-[0.25em] text-slate-400">
    POWERED BY {APP_AUTHOR}
  </div>
</div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Logged in as
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                {user?.name}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate("/pos")}
                className="h-11 rounded-xl px-4 font-semibold"
              >
                <ShoppingCart size={17} />
                POS
              </Button>

              <Button
                variant="ghost"
                onClick={logout}
                className="h-11 rounded-xl px-4 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut size={17} />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
