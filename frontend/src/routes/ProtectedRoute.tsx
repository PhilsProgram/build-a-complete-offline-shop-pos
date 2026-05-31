import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/models';

export function ProtectedRoute({ roles }: { roles: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-paper text-ink">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/pos'} replace />;
  }

  return <Outlet />;
}
