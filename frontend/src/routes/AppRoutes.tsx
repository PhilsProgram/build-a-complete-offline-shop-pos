import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { PosLayout } from '../layouts/PosLayout';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { BackupPage } from '../pages/admin/BackupPage';
import { DebtorsPage } from '../pages/admin/DebtorsPage';
import { EodPage } from '../pages/admin/EodPage';
import { EmployeesPage } from '../pages/admin/EmployeesPage';
import { ExpensesPage } from '../pages/admin/ExpensesPage';
import { ProductsPage } from '../pages/admin/ProductsPage';
import { ReportsPage } from '../pages/admin/ReportsPage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { TransactionsPage } from '../pages/admin/TransactionsPage';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { PosPage } from '../pages/pos/PosPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AnalyticsPage } from '../pages/admin/AnalyticsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login/:role" element={<LoginPage />} />

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="debtors" element={<DebtorsPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="eod" element={<EodPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="backup" element={<BackupPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['EMPLOYEE', 'ADMIN']} />}>
        <Route path="/pos" element={<PosLayout />}>
          <Route index element={<PosPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
