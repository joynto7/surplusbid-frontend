import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, tokenStorage, type Me } from '../lib/api';

interface AuthContextValue {
  user: Me | null;
  loading: boolean;
  refreshUser: () => Promise<Me | null>;
  login: (email: string, password: string) => Promise<Me>;
  register: (input: { email: string; password: string; role: 'BUYER' | 'SELLER'; companyName: string }) => Promise<Me>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const me = await api.me();
      setUser(me);
      return me;
    } catch {
      tokenStorage.clear();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password });
    tokenStorage.setTokens(result.accessToken, result.refreshToken);
    const me = await api.me();
    setUser(me);
    return me;
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; role: 'BUYER' | 'SELLER'; companyName: string }) => {
      const result = await api.register(input);
      tokenStorage.setTokens(result.accessToken, result.refreshToken);
      const me = await api.me();
      setUser(me);
      return me;
    },
    []
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    api.logout().catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser, login, register, logout }),
    [user, loading, refreshUser, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
