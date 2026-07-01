import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authApi from "../api/auth";
import { setOnAuthFailure } from "../api/client";
import { tokenStorage } from "./storage";

type AuthState = {
  user: authApi.User | null;
  isLoading: boolean; // true while restoring session on boot
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<authApi.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    // Revoga o refresh token no servidor antes de limpar o dispositivo.
    try {
      const refresh = await tokenStorage.getRefresh();
      if (refresh) await authApi.logout(refresh);
    } catch {
      // Best-effort: se falhar (offline/token expirado), seguimos com o logout local.
    }
    await tokenStorage.clear();
    setUser(null);
  }, []);

  // Restore session on app boot: if we have a token, fetch the current user.
  useEffect(() => {
    setOnAuthFailure(() => setUser(null));
    (async () => {
      try {
        const access = await tokenStorage.getAccess();
        if (access) {
          const me = await authApi.fetchMe();
          setUser(me);
        }
      } catch {
        await tokenStorage.clear();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await authApi.login(username, password);
    await tokenStorage.save(tokens.access, tokens.refresh);
    const me = await authApi.fetchMe();
    setUser(me);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await authApi.register(username, email, password);
      // Auto-login right after a successful registration.
      const tokens = await authApi.login(username, password);
      await tokenStorage.save(tokens.access, tokens.refresh);
      const me = await authApi.fetchMe();
      setUser(me);
    },
    []
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
