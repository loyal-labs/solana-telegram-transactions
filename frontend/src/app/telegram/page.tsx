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
import { useCallback, useEffect, useRef, useState } from 'react';

import ReceiveSheet from '@/components/wallet/ReceiveSheet';
import SendSheet from '@/components/wallet/SendSheet';
import WalletBalance from '@/components/wallet/WalletBalance';
import { TELEGRAM_BOT_ID } from '@/lib/constants';
import { getWalletPublicKey } from '@/lib/solana/wallet-details';
import { ensureWalletKeypair } from '@/lib/solana/wallet-keypair-logic';
import { initTelegram, sendString } from '@/lib/telegram';
import {
  hideMainButton,
  hideSecondaryButton,
  showReceiveShareButton,
  showWalletHomeButtons,
} from '@/lib/telegram/buttons';
import { cleanInitData, createValidationString, validateInitData } from '@/lib/telegram/init-data-transform';
import { ensureTelegramTheme, themeSignals } from '@/lib/telegram/theme';



hashes.sha512 = sha512;

export default function Home() {
  const rawInitData = useRawInitData();
  const [isSendSheetOpen, setSendSheetOpen] = useState(false);
  const [isReceiveSheetOpen, setReceiveSheetOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const mainButtonAvailable = useSignal(mainButton.setParams.isAvailable);
  const secondaryButtonAvailable = useSignal(secondaryButton.setParams.isAvailable);
  const backgroundColor = useSignal(themeSignals.backgroundColor);
  const secondaryBackgroundColor = useSignal(themeSignals.secondaryBackgroundColor);
  const textColor = useSignal(themeSignals.textColor);
  const sectionSeparatorColor = useSignal(themeSignals.sectionSeparatorColor);
  const ensuredWalletRef = useRef(false);

  const handleOpenSendSheet = useCallback(() => {
    setSendSheetOpen(true);
  }, []);

  const handleOpenReceiveSheet = useCallback(() => {
    setReceiveSheetOpen(true);
  }, []);

  const handleShareAddress = useCallback(async () => {
    try {
      const address =
        walletAddress ??
        (await getWalletPublicKey().then((publicKey) => {
          const base58 = publicKey.toBase58();
          setWalletAddress((prev) => prev ?? base58);
          return base58;
        }));

      if (!address) {
        console.warn("Wallet address unavailable");
        return;
      }

      const canUseShare =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        (typeof window === "undefined" || window.isSecureContext);

      if (canUseShare) {
        try {
          await navigator.share({
            title: "My Solana address",
            text: address,
          });
          return;
        } catch (shareError) {
          if (
            shareError instanceof DOMException &&
            (shareError.name === "AbortError" ||
              shareError.name === "NotAllowedError")
          ) {
            // User cancelled or platform disallowed; fall back.
          } else {
            console.warn("Web Share failed, falling back to copy", shareError);
          }
        }
      } else {
        console.warn("Web Share API unavailable, attempting copy fallback");
      }

      if (navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(address);
          console.log("Copied wallet address to clipboard");
          return;
        } catch (copyError) {
          console.warn("Clipboard copy failed, attempting Telegram share", copyError);
        }
      }

      if (sendString(address)) {
        console.log("Shared wallet address via Telegram bridge");
        return;
      }

      console.warn("No available method to share wallet address");
    } catch (error) {
      console.error("Failed to share wallet address", error);
    }
  }, [walletAddress]);

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
    if (ensuredWalletRef.current) return;

    ensuredWalletRef.current = true;

	    void (async () => {
	      try {
	        const { keypair, isNew } = await ensureWalletKeypair();
	        const publicKeyBase58 = keypair.publicKey.toBase58();
	        console.log("Wallet keypair ready", {
	          isNew,
	          publicKey: publicKeyBase58,
	        });
	        setWalletAddress(publicKeyBase58);
	      } catch (error) {
	        console.error("Failed to ensure wallet keypair", error);
	      }
	    })();
	  }, []);

  useEffect(() => {
    if (!mainButtonAvailable) {
      mainButton.mount.ifAvailable?.();
      hideMainButton();
    }

    if (!secondaryButtonAvailable) {
      secondaryButton.mount.ifAvailable?.();
      hideSecondaryButton();
    }

    if (!mainButtonAvailable) {
      return () => {
        hideMainButton();
        hideSecondaryButton();
      };
    }

    if (isReceiveSheetOpen) {
      hideSecondaryButton();
      showReceiveShareButton({
        onShare: handleShareAddress,
      });
    } else {
      showWalletHomeButtons({
        onSend: handleOpenSendSheet,
        onReceive: handleOpenReceiveSheet,
      });
    }

    return () => {
      hideMainButton();
      hideSecondaryButton();
    };
  }, [
    isReceiveSheetOpen,
    mainButtonAvailable,
    secondaryButtonAvailable,
    handleOpenSendSheet,
    handleOpenReceiveSheet,
    handleShareAddress,
  ]);

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
