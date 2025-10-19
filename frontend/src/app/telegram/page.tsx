'use client';

import { hashes } from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

import { cleanInitData, createValidationString, validateInitData } from '@/lib/telegram/init-data-transform';
import { ensureTelegramTheme, themeSignals } from '@/lib/telegram/theme';
import { hideMainButton, hideSecondaryButton, showMainButton, showSecondaryButton } from '@/lib/telegram/buttons';
import {
  mainButton,
  secondaryButton,
  useRawInitData,
  useSignal
} from '@telegram-apps/sdk-react';


import { TELEGRAM_BOT_ID } from '@/lib/telegram/constants';
import { initTelegram } from '@/lib/telegram';
import { useEffect } from 'react';


hashes.sha512 = sha512;

export default function Home() {
  const rawInitData = useRawInitData();

  const mainButtonAvailable = useSignal(mainButton.setParams.isAvailable);
  const secondaryButtonAvailable = useSignal(secondaryButton.setParams.isAvailable);
  const backgroundColor = useSignal(themeSignals.backgroundColor);
  const secondaryBackgroundColor = useSignal(themeSignals.secondaryBackgroundColor);
  const textColor = useSignal(themeSignals.textColor);
  const accentTextColor = useSignal(themeSignals.accentTextColor);
  const subtitleTextColor = useSignal(themeSignals.subtitleTextColor);
  const hintColor = useSignal(themeSignals.hintColor);
  const buttonColor = useSignal(themeSignals.buttonColor);
  const buttonTextColor = useSignal(themeSignals.buttonTextColor);
  const sectionSeparatorColor = useSignal(themeSignals.sectionSeparatorColor);

  useEffect(() => {
    if (rawInitData) {
      const cleanInitDataResult = cleanInitData(rawInitData);
      const validationString = createValidationString(TELEGRAM_BOT_ID, cleanInitDataResult);

      const signature = cleanInitDataResult.signature as string;
      const isValid = validateInitData(validationString, signature);
      console.log("Signature is valid: ", isValid);
    }
  }, [rawInitData]);

  useEffect(() => {
    initTelegram();
    void ensureTelegramTheme();
  }, []);

  useEffect(() => {
    if (!mainButtonAvailable) {
      mainButton.mount.ifAvailable?.();
      hideMainButton();
      return;
    }

    showMainButton({
      text: "Send",
      ...(buttonColor ? { backgroundColor: buttonColor } : {}),
      ...(buttonTextColor ? { textColor: buttonTextColor } : {}),
      onClick: () => {
        console.log("Main button pressed");
      },
    });

    return () => {
      hideMainButton();
    };
  }, [mainButtonAvailable, buttonColor, buttonTextColor, secondaryBackgroundColor]);

  useEffect(() => {
    if (!secondaryButtonAvailable) {
      secondaryButton.mount.ifAvailable?.();
      hideSecondaryButton();
      return;
    }

    showSecondaryButton({
      text: "Receive",
      position: "left",
      ...(buttonColor ? { backgroundColor: buttonColor } : {}),
      ...(buttonTextColor ? { textColor: buttonTextColor } : {}),
      onClick: () => {
        console.log("Secondary button pressed");
      },
    });

    return () => {
      hideSecondaryButton();
    };
  }, [secondaryButtonAvailable, buttonColor, buttonTextColor]);

  const resolvedBackgroundColor =
    secondaryBackgroundColor ?? 'var(--tg-theme-bg-color, #ffffff)';
  const resolvedSurfaceColor =
    backgroundColor ?? 'var(--tg-theme-secondary-bg-color, rgba(15, 23, 42, 0.04))';
  const resolvedTextColor =
    textColor ?? 'var(--tg-theme-text-color, #1f2937)';
  const resolvedHeadingColor = accentTextColor ?? resolvedTextColor;
  const resolvedSubtitleColor =
    subtitleTextColor ?? hintColor ?? 'var(--tg-theme-subtitle-text-color, rgba(15, 23, 42, 0.6))';
  const resolvedButtonBackground =
    buttonColor ?? 'var(--tg-theme-button-color, #2481cc)';
  const resolvedButtonText =
    buttonTextColor ?? 'var(--tg-theme-button-text-color, #ffffff)';
  const resolvedBorderColor =
    sectionSeparatorColor ?? 'var(--tg-theme-section-separator-color, rgba(15, 23, 42, 0.08))';

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-8 text-center transition-colors"
      style={{
        backgroundColor: resolvedBackgroundColor,
        color: resolvedTextColor,
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border px-8 py-10 shadow-sm transition-colors"
        style={{
          backgroundColor: resolvedSurfaceColor,
          borderColor: resolvedBorderColor,
        }}
      >
        <h1
          className="text-4xl font-bold"
          style={{ color: resolvedHeadingColor }}
        >
          Welcome to Next.js!
        </h1>
        <p
          className="mt-4 text-lg"
          style={{ color: resolvedSubtitleColor }}
        >
          Get started by editing <code>src/app/page.tsx</code>
        </p>
        <a
          className="mt-6 inline-block rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          style={{
            backgroundColor: resolvedButtonBackground,
            color: resolvedButtonText,
          }}
          href="https://nextjs.org/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the Next.js docs
        </a>
      </div>
    </main>
  );
}
