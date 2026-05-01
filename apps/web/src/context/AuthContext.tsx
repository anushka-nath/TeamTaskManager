import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, setAccessToken } from "@/lib/api";
import type { RegisterInput } from "@ttm/shared";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.data);
    } catch {
      try {
        const refreshRes = await api.post("/auth/refresh");
        setAccessToken(refreshRes.data.data.accessToken);
        const meRes = await api.get("/auth/me");
        setUser(meRes.data.data);
      } catch {
        setUser(null);
        setAccessToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { user, accessToken } = res.data.data;
    setAccessToken(accessToken);
    setUser(user);
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    const res = await api.post("/auth/register", data);
    const { user, accessToken } = res.data.data;
    setAccessToken(accessToken);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setAccessToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
