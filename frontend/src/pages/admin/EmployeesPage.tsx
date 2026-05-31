import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  KeyRound,
  Trash2,
  UserPlus,
  ShieldCheck,
  Users,
  UserCheck,
  UserX
} from 'lucide-react';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Table, Td, Th } from '../../components/ui/Table';

import { managementService } from '../../services/managementService';

import type { AuthUser } from '../../types/models';

export function EmployeesPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const result = await managementService.users();
    setUsers(result.users);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    await managementService.createUser({
      name: String(form.get('name')),
      username: String(form.get('username')),
      password: String(form.get('password')),
      role: String(form.get('role')) as 'ADMIN' | 'EMPLOYEE',
      active: true
    });

    event.currentTarget.reset();

    await load();
  }

  async function toggleActive(user: AuthUser) {
    await managementService.updateUser(user.id, {
      active: !Boolean(user.active)
    });

    await load();
  }

  async function resetPassword(user: AuthUser) {
    const password = window.prompt(`New password/PIN for ${user.name}`);

    if (!password) return;

    await managementService.resetPassword(user.id, password);
  }

  async function deleteUser(id: number) {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this employee?'
    );

    if (!confirmDelete) return;

    await managementService.deleteUser(id);

    await load();
  }

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const employees = users.filter((u) => u.role === 'EMPLOYEE').length;
    const active = users.filter((u) => Boolean(u.active)).length;
    const disabled = users.filter((u) => !Boolean(u.active)).length;

    return {
      admins,
      employees,
      active,
      disabled
    };
  }, [users]);

  return (
    <div className="grid gap-6">
      {/* HEADER */}

      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-300">
              Employee Management
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Staff & Access Control
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Create employee accounts, manage admin privileges,
              reset passwords, and control access to the POS system.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-slate-300">
                <Users size={16} />
                <span className="text-xs">Employees</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {stats.employees}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck size={16} />
                <span className="text-xs">Admins</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {stats.admins}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-slate-300">
                <UserCheck size={16} />
                <span className="text-xs">Active</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {stats.active}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-slate-300">
                <UserX size={16} />
                <span className="text-xs">Disabled</span>
              </div>

              <p className="mt-2 text-2xl font-black">
                {stats.disabled}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">

        {/* CREATE USER */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-900 text-white">
              <UserPlus size={22} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">
                Create Employee
              </h2>

              <p className="text-sm text-slate-500">
                Add new staff access credentials
              </p>
            </div>
          </div>

          <form
            onSubmit={handleCreate}
            className="mt-6 grid gap-4"
          >
            <Field label="Full Name">
              <Input
                name="name"
                required
                placeholder="John Doe"
              />
            </Field>

            <Field label="Username">
              <Input
                name="username"
                required
                placeholder="john"
              />
            </Field>

            <Field label="Password / PIN">
              <Input
                name="password"
                required
                type="password"
                placeholder="••••••••"
              />
            </Field>

            <Field label="Account Role">
              <Select name="role" defaultValue="EMPLOYEE">
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </Field>

            {error && (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}

            <Button type="submit" className="h-12">
              <UserPlus size={18} />
              Create Account
            </Button>
          </form>
        </section>

        {/* EMPLOYEE TABLE */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black text-slate-900">
              Employees
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage permissions, passwords, and account access
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Username</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-slate-50"
                  >
                    <Td>
                      <div>
                        <p className="font-bold text-slate-800">
                          {user.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          Staff Account
                        </p>
                      </div>
                    </Td>

                    <Td>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold">
                        @{user.username}
                      </span>
                    </Td>

                    <Td>
                      <Badge
                        tone={
                          user.role === 'ADMIN'
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        {user.role}
                      </Badge>
                    </Td>

                    <Td>
                      <Badge
                        tone={
                          Boolean(user.active)
                            ? 'good'
                            : 'bad'
                        }
                      >
                        {Boolean(user.active)
                          ? 'Active'
                          : 'Disabled'}
                      </Badge>
                    </Td>

                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => void toggleActive(user)}
                        >
                          {Boolean(user.active)
                            ? 'Disable'
                            : 'Enable'}
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void resetPassword(user)}
                        >
                          <KeyRound size={16} />
                          Reset
                        </Button>

                        <Button
                          type="button"
                          variant="danger"
                          className="h-10 w-10 px-0"
                          onClick={() => void deleteUser(user.id)}
                          aria-label="Delete user"
                        >
                          <Trash2 size={16} />
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