'use client';

import { hashes } from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import {
  mainButton,
  secondaryButton,
  useRawInitData,
  useSignal
} from '@telegram-apps/sdk-react';
import { List } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';

import ReceiveSheet from '@/components/wallet/ReceiveSheet';
import SendSheet from '@/components/wallet/SendSheet';
import WalletBalance from '@/components/wallet/WalletBalance';
import { initTelegram } from '@/lib/telegram';
import { hideMainButton, hideSecondaryButton, showMainButton, showSecondaryButton } from '@/lib/telegram/buttons';
import { TELEGRAM_BOT_ID } from '@/lib/telegram/constants';
import { cleanInitData, createValidationString, validateInitData } from '@/lib/telegram/init-data-transform';
import { ensureTelegramTheme, themeSignals } from '@/lib/telegram/theme';



hashes.sha512 = sha512;

export default function Home() {
  const rawInitData = useRawInitData();
  const [isSendSheetOpen, setSendSheetOpen] = useState(false);
  const [isReceiveSheetOpen, setReceiveSheetOpen] = useState(false);

  const mainButtonAvailable = useSignal(mainButton.setParams.isAvailable);
  const secondaryButtonAvailable = useSignal(secondaryButton.setParams.isAvailable);
  const backgroundColor = useSignal(themeSignals.backgroundColor);
  const secondaryBackgroundColor = useSignal(themeSignals.secondaryBackgroundColor);
  const textColor = useSignal(themeSignals.textColor);
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
        setSendSheetOpen(true);
      },
    });

    return () => {
      hideMainButton();
    };
  }, [mainButtonAvailable, buttonColor, buttonTextColor]);

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
        setReceiveSheetOpen(true);
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
  const resolvedBorderColor =
    sectionSeparatorColor ?? 'var(--tg-theme-section-separator-color, rgba(15, 23, 42, 0.08))';

  return (
    <>
      <main
        className="flex min-h-screen flex-col gap-4 p-4 transition-colors"
        style={{
          backgroundColor: resolvedBackgroundColor,
          color: resolvedTextColor,
        }}
      >
        <List
          style={{
            backgroundColor: resolvedSurfaceColor,
            border: `1px solid ${resolvedBorderColor}`,
            borderRadius: 'var(--tgui--border_radius_m)',
            color: resolvedTextColor,
            margin: '0 auto',
            maxWidth: 480,
            width: '100%',
          }}
        >
          <WalletBalance />
        </List>
      </main>
      <SendSheet open={isSendSheetOpen} onOpenChange={setSendSheetOpen} trigger={null} />
      <ReceiveSheet open={isReceiveSheetOpen} onOpenChange={setReceiveSheetOpen} trigger={null} />
    </>
  );
}
