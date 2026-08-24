import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, normalizeError, TOKEN_KEY } from "../lib/api";
import type { AuthUserResponse, LoginRequest, RegisterRequest, TokenResponse } from "../lib/types";

interface AuthContextValue {
  user: AuthUserResponse | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const res = await api.get<AuthUserResponse>("/auth/me");
    setUser(res.data);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchMe()
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [fetchMe]);

  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        const res = await api.post<TokenResponse>("/auth/login", data);
        localStorage.setItem(TOKEN_KEY, res.data.access_token);
        await fetchMe();
      } catch (err) {
        throw normalizeError(err);
      }
    },
    [fetchMe],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        await api.post<AuthUserResponse>("/auth/register", data);
        await login({ email: data.email, password: data.password });
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw normalizeError(err);
      }
    },
    [login],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAdmin: user?.role?.toUpperCase() === "ADMIN",
      login,
      register,
      logout,
      refreshUser: fetchMe,
    }),
    [user, isLoading, login, register, logout, fetchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
