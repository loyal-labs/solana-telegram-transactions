"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { EmailAuthUser } from "@loyal-labs/grid-core";

import { authApiClient } from "@/lib/auth/client";

type AuthSessionContextValue = {
  isAuthenticated: boolean;
  isHydrated: boolean;
  user: EmailAuthUser | null;
  refreshSession: () => Promise<void>;
  setAuthenticatedUser: (user: EmailAuthUser) => void;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EmailAuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshSession = useCallback(async () => {
    const nextUser = await authApiClient.getSession();
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      try {
        const nextUser = await authApiClient.getSession();
        if (!cancelled) {
          setUser(nextUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    }

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const setAuthenticatedUser = useCallback((nextUser: EmailAuthUser) => {
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await authApiClient.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: user !== null,
      isHydrated,
      user,
      refreshSession,
      setAuthenticatedUser,
      logout,
    }),
    [isHydrated, refreshSession, setAuthenticatedUser, user, logout]
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }

  return context;
}
