'use client';

import { init } from '@telegram-apps/sdk';
import { type PropsWithChildren, useEffect } from 'react';

import { useDidMount } from '@/hooks/useDidMount';

function TelegramProviderInner({ children }: PropsWithChildren) {
  useEffect(() => {
    // Initialize Telegram SDK
    try {
      init();
    } catch (error) {
      console.error('Failed to initialize Telegram SDK:', error);
    }
  }, []);

  return <>{children}</>;
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