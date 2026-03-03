"use client";

import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useConnection } from "@/components/solana/phantom-provider";
import { useAnchorWallet } from "@/hooks/use-anchor-wallet";
import {
  fetchAllUserChats,
  fetchUserContext,
  initializeUserContext,
} from "@/lib/loyal/service";
import type { UserChat, UserContext } from "@/lib/loyal/types";

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
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [userChats, setUserChats] = useState<UserChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUserChats = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!anchorWallet) {
        setUserContext(null);
        setUserChats([]);
        setIsLoading(false);
        return;
      }

      const { signal } = options ?? {};

      setIsLoading(true);

      try {
        // Only FETCH context, never auto-create (no signing on page load)
        const context = await fetchUserContext(connection, anchorWallet);
        if (signal?.aborted) return;

        if (context) {
          setUserContext(context);
          const chats =
            (await fetchAllUserChats(
              connection,
              anchorWallet,
              context.nextChatId
            )) ?? [];

          if (!signal?.aborted) {
            setUserChats(chats);
          }
        } else {
          // No context exists - that's fine, user hasn't created one yet
          // Context will be created lazily when needed (e.g., first chat)
          setUserContext(null);
          setUserChats([]);
        }
      } catch (error) {
        if (signal?.aborted) {
          return;
        }
        console.error("Failed to fetch user context:", error);
        setUserContext(null);
        setUserChats([]);
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [anchorWallet, connection]
  );

  const refreshUserChats = useCallback(async () => {
    await loadUserChats();
  }, [loadUserChats]);

  const ensureUserContext = useCallback(async (): Promise<UserContext> => {
    // Return existing context if available
    if (userContext) return userContext;

    if (!anchorWallet) {
      throw new Error("Wallet not connected");
    }

    // Try to fetch from blockchain first
    let context = await fetchUserContext(connection, anchorWallet);

    if (!context) {
      // Context doesn't exist - create it now (this triggers signing)
      context = await initializeUserContext(connection, anchorWallet);
    }

    setUserContext(context);
    return context;
  }, [anchorWallet, connection, userContext]);

  useEffect(() => {
    if (!anchorWallet) {
      setUserContext(null);
      setUserChats([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    void loadUserChats({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [anchorWallet, loadUserChats]);

  const value = useMemo<UserChatsContextValue>(
    () => ({
      userContext,
      userChats,
      isLoading,
      refreshUserChats,
      ensureUserContext,
    }),
    [ensureUserContext, isLoading, refreshUserChats, userChats, userContext]
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
