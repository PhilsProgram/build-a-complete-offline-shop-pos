import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { getStoredToken } from '../services/http';
import type { AuthUser, UserRole } from '../types/models';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string, role: UserRole) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    authService.me()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => {
        authService.logout();
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    loading,
    async login(username, password, role) {
      const result = await authService.login({ username, password, role });
      setToken(result.token);
      setUser(result.user);
      return result.user;
    },
    logout() {
      authService.logout();
      setToken(null);
      setUser(null);
    }
  }), [loading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
