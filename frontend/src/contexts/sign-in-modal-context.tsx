"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type SignInModalContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const SignInModalContext = createContext<SignInModalContextValue | null>(null);

export function SignInModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <SignInModalContext.Provider value={value}>
      {children}
    </SignInModalContext.Provider>
  );
}

export function useSignInModal() {
  const context = useContext(SignInModalContext);
  if (!context) {
    throw new Error("useSignInModal must be used within SignInModalProvider");
  }
  return context;
}
