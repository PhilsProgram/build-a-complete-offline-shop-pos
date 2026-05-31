import { ArrowLeft, LogIn, ShieldCheck, UserRound } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/models';

export function LoginPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const role = useMemo<UserRole>(
    () => (params.role === 'admin' ? 'ADMIN' : 'EMPLOYEE'),
    [params.role]
  );

  if (user) {
    return (
      <Navigate
        to={user.role === 'ADMIN' ? '/admin' : '/pos'}
        replace
      />
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError('');

    const form = new FormData(event.currentTarget);

    try {
      const loggedIn = await login(
        String(form.get('username')),
        String(form.get('password')),
        role
      );

      navigate(
        loggedIn.role === 'ADMIN' ? '/admin' : '/pos',
        { replace: true }
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isAdmin = role === 'ADMIN';

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200">
      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-20 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">

          {/* LEFT SIDE */}
          <section className="hidden lg:flex flex-col justify-between bg-[#0C2C1F] p-10 text-white">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                  {isAdmin ? (
                    <ShieldCheck size={28} />
                  ) : (
                    <UserRound size={28} />
                  )}
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">
                    Offline Shop POS
                  </p>

                  <h1 className="text-3xl font-black">
                    {isAdmin ? 'Admin Portal' : 'Employee Portal'}
                  </h1>
                </div>
              </div>

              <div className="mt-16 space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <h3 className="text-lg font-bold">
                    {isAdmin
                      ? 'Complete business management'
                      : 'Fast and efficient checkout'}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {isAdmin
                      ? 'Manage stock, debtors, employees, reports, analytics, and complete shop operations from one place.'
                      : 'Process transactions quickly, manage customers, and keep sales flowing smoothly.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-3xl font-black">100%</p>
                    <p className="text-sm text-slate-300">
                      Offline Ready
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-3xl font-black">LAN</p>
                    <p className="text-sm text-slate-300">
                      Multi Device
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-400">
              Secure local network POS system
            </p>
          </section>

          {/* RIGHT SIDE */}
          <section className="flex items-center justify-center p-6 sm:p-10">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md"
            >
              <Link
                to="/"
                className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
              >
                <ArrowLeft size={16} />
                Back
              </Link>

              <div className="mb-8">
                <div
                  className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${
                    isAdmin
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {isAdmin ? (
                    <ShieldCheck size={30} />
                  ) : (
                    <UserRound size={30} />
                  )}
                </div>

                <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                  {role}
                </p>

                <h2 className="mt-2 text-4xl font-black text-slate-900">
                  Welcome Back
                </h2>

                <p className="mt-2 text-slate-500">
                  Sign in to continue using the system.
                </p>
              </div>

              <div className="space-y-5">
                <Field label="Username">
                  <Input
                    name="username"
                    autoComplete="username"
                    required
                    autoFocus
                  />
                </Field>

                <Field label="Password or PIN">
                  <Input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </Field>

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-2xl text-base font-bold"
                >
                  <LogIn size={18} />

                  {submitting
                    ? 'Signing in...'
                    : `Login as ${isAdmin ? 'Admin' : 'Employee'}`}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}