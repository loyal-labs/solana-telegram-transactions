"use client";

import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useMemo } from "react";

// TODO: wire real implementations when @/lib/loyal/service is restored
type UserContext = { nextChatId: number };
type UserChat = { id: string; title: string };

type UserChatsContextValue = {
  userContext: UserContext | null;
  userChats: UserChat[];
  isLoading: boolean;
  refreshUserChats: () => Promise<void>;
  ensureUserContext: () => Promise<UserContext>;
};

const UserChatsContext = createContext<UserChatsContextValue | undefined>(
  undefined
);

export const UserChatsProvider = ({ children }: PropsWithChildren) => {
  const refreshUserChats = useCallback(async () => {}, []);
  const ensureUserContext = useCallback(
    async (): Promise<UserContext> => ({ nextChatId: 0 }),
    []
  );

  const value = useMemo<UserChatsContextValue>(
    () => ({
      userContext: null,
      userChats: [],
      isLoading: false,
      refreshUserChats,
      ensureUserContext,
    }),
    [refreshUserChats, ensureUserContext]
  );

  return (
    <UserChatsContext.Provider value={value}>
      {children}
    </UserChatsContext.Provider>
  );
};

export const useUserChats = () => {
  const context = useContext(UserChatsContext);
  if (!context) {
    throw new Error("useUserChats must be used within a UserChatsProvider");
  }
  return context;
};
