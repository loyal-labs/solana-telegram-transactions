'use client';

import { init } from '@telegram-apps/sdk';
import { useRawInitData } from '@telegram-apps/sdk-react';
import { usePathname } from 'next/navigation';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useDidMount } from '@/hooks/useDidMount';
import {
  getCloudValue,
  setCloudValue,
} from '@/lib/telegram/mini-app/cloud-storage';
import {
  parseUserFromInitData,
  type UserData,
} from '@/lib/telegram/mini-app/init-data-transform';

// Patch console.error to suppress specific Telegram SDK errors
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      args.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes(
            'An error occurred processing the "viewport_changed" event'
          ) ||
            arg.includes(
              'An error occurred processing the "theme_changed" event'
            ) ||
            arg.includes(
              'An error occurred processing the "popup_closed" event'
            ))
      )
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

const USER_AVATAR_CACHE_KEY = 'user_avatar_cache';
const LAST_PAGE_CACHE_KEY = 'last_visited_page';

interface TelegramUserContextType {
  userData: UserData | null;
  cachedAvatar: string | null;
  setCachedAvatar: (avatar: string | null) => void;
  isAvatarLoading: boolean;
}

const TelegramUserContext = createContext<TelegramUserContextType>({
  userData: null,
  cachedAvatar: null,
  setCachedAvatar: () => {},
  isAvatarLoading: true,
});

export const useTelegramUser = () => useContext(TelegramUserContext);

function TelegramProviderInner({ children }: PropsWithChildren) {
  const rawInitData = useRawInitData();
  const pathname = usePathname();
  const [cachedAvatar, setCachedAvatar] = useState<string | null>(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    // Initialize Telegram SDK
    try {
      init();
    } catch (error) {
      console.error('Failed to initialize Telegram SDK:', error);
    }
  }, []);

  // Mark as restored immediately - splash screen handles initial navigation
  useEffect(() => {
    setIsRestored(true);
  }, []);

  // Save page
  useEffect(() => {
    if (!isRestored || !pathname) return;
    if (pathname.startsWith('/telegram')) {
      setCloudValue(LAST_PAGE_CACHE_KEY, pathname).catch((e) =>
        console.error('Failed to save page', e)
      );
    }
  }, [pathname, isRestored]);

  const userData = useMemo(
    () => parseUserFromInitData(rawInitData),
    [rawInitData]
  );

  // Load avatar from cloud storage immediately
  useEffect(() => {
    async function initCache() {
      try {
        const stored = await getCloudValue(USER_AVATAR_CACHE_KEY);
        if (stored && typeof stored === 'string') {
          setCachedAvatar(stored);
        }
      } finally {
        setIsAvatarLoading(false);
      }
    }
    initCache();
  }, []);

  // Sync avatar with cloud storage
  useEffect(() => {
    if (!userData?.photoUrl) return;

    const url = userData.photoUrl;

    async function sync() {
      try {
        const response = await fetch(
          `/api/telegram/proxy-image?url=${encodeURIComponent(url)}`
        );
        if (!response.ok) throw new Error('Fetch failed');
        const blob = await response.blob();

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const stored = await getCloudValue(USER_AVATAR_CACHE_KEY);
        if (stored !== base64) {
          await setCloudValue(USER_AVATAR_CACHE_KEY, base64);
          setCachedAvatar(base64);
        }
      } catch (e) {
        console.error('Avatar sync failed', e);
      }
    }

    sync();
  }, [userData?.photoUrl]);

  return (
    <TelegramUserContext.Provider
      value={{ userData, cachedAvatar, setCachedAvatar, isAvatarLoading }}
    >
      {children}
    </TelegramUserContext.Provider>
  );
}

export function TelegramProvider(props: PropsWithChildren) {
  // Wait for client-side mount before initializing
  const didMount = useDidMount();

  return didMount ? (
    <TelegramProviderInner {...props} />
  ) : (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}