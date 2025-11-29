"use client";

import { useCallback, useEffect, useState } from "react";

interface SafeAreaInsets {
  top: number;
  bottom: number;
}

const getWebApp = () => {
  return (window as { Telegram?: { WebApp?: {
    isVersionAtLeast?: (version: string) => boolean;
    contentSafeAreaInset?: { top: number; bottom: number };
    safeAreaInset?: { top: number; bottom: number };
    onEvent?: (eventType: string, callback: () => void) => void;
    offEvent?: (eventType: string, callback: () => void) => void;
  } } }).Telegram?.WebApp;
};

const getSafeArea = (): SafeAreaInsets => {
  const webApp = getWebApp();
  if (!webApp) return { top: 0, bottom: 0 };

  const hasContentSafe = webApp.isVersionAtLeast?.("8.0") ?? false;
  const contentInsets = hasContentSafe ? webApp.contentSafeAreaInset : undefined;
  const deviceInsets = webApp.safeAreaInset;

  return {
    top: (contentInsets?.top ?? 0) + (deviceInsets?.top ?? 0),
    bottom: (contentInsets?.bottom ?? 0) + (deviceInsets?.bottom ?? 0),
  };
};

/**
 * Hook that provides Telegram safe area insets.
 */
export function useTelegramSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({ top: 0, bottom: 0 });

  const updateInsets = useCallback(() => {
    setInsets(getSafeArea());
  }, []);

  useEffect(() => {
    updateInsets();

    const webApp = getWebApp();
    webApp?.onEvent?.("contentSafeAreaChanged", updateInsets);
    webApp?.onEvent?.("safeAreaChanged", updateInsets);
    webApp?.onEvent?.("viewportChanged", updateInsets);

    return () => {
      webApp?.offEvent?.("contentSafeAreaChanged", updateInsets);
      webApp?.offEvent?.("safeAreaChanged", updateInsets);
      webApp?.offEvent?.("viewportChanged", updateInsets);
    };
  }, [updateInsets]);

  return insets;
}

/**
 * Calculate modal snap point that leaves room for top safe area.
 */
export function useModalSnapPoint(): number {
  const { top } = useTelegramSafeArea();
  const [snapPoint, setSnapPoint] = useState(0.92);

  useEffect(() => {
    const vh = window.innerHeight;
    if (vh <= 0 || top <= 0) {
      setSnapPoint(0.92);
      return;
    }
    // Leave room for top safe area + small buffer
    const maxHeight = vh - top - 8;
    setSnapPoint(Math.max(0.7, Math.min(0.95, maxHeight / vh)));
  }, [top]);

  return snapPoint;
}
