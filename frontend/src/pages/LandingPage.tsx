import { ShieldCheck, Store, UserRound } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-600">
            Loading POS System...
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to={user.role === 'ADMIN' ? '/admin' : '/pos'}
        replace
      />
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-white to-slate-200" />

      {/* Floating Shapes */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-slate-300/30 blur-3xl" />

      {/* Card */}
      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/40 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg">
            <Store size={38} className="text-white" />
          </div>

          <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-emerald-700">
            Offline Shop POS
          </p>

          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Welcome Back
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Securely access the shop management system or continue sales operations.
          </p>
        </div>

        {/* Login Options */}
        <div className="space-y-4">
          <Link to="/login/admin">
            <Button
              className="group flex h-16 w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-left transition-all hover:-translate-y-1 hover:bg-emerald-100"
              variant="secondary"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-600 p-3 text-white shadow">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    Administrator
                  </p>
                  <p className="text-xs text-slate-500">
                    Manage shop operations & reports
                  </p>
                </div>
              </div>

              <span className="text-sm font-semibold text-emerald-700">
                Login
              </span>
            </Button>
          </Link>

          <Link to="/login/employee">
            <Button className="group flex h-16 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 text-left transition-all hover:-translate-y-1 hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-slate-900 p-3 text-white shadow">
                  <UserRound size={22} />
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    Employee POS
                  </p>
                  <p className="text-xs text-slate-500">
                    Start sales and manage transactions
                  </p>
                </div>
              </div>

              <span className="text-sm font-semibold text-slate-700">
                Open
              </span>
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-200 pt-4 text-center">
          <p className="text-xs text-slate-400">
            Offline LAN Powered • Secure Local Database
          </p>
        </div>
      </section>
    </main>
  );
}