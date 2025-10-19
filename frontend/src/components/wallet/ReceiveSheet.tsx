"use client";

import { useSignal } from "@telegram-apps/sdk-react";
import {
  Button,
  Cell,
  List,
  Modal,
  VisuallyHidden,
} from "@telegram-apps/telegram-ui";
import { Icon28Close } from "@telegram-apps/telegram-ui/dist/icons/28/close";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getWalletPublicKey } from "@/lib/solana/wallet-details";
import { themeSignals } from "@/lib/telegram/theme";

export type ReceiveSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DEFAULT_TRIGGER = <Button size="m">Receive</Button>;

const FALLBACKS = {
  surface: "var(--tg-theme-bg-color, #ffffff)",
  background: "var(--tg-theme-secondary-bg-color, rgba(15, 23, 42, 0.04))",
  border: "var(--tg-theme-section-separator-color, rgba(15, 23, 42, 0.08))",
  text: "var(--tg-theme-text-color, #1f2937)",
} as const;

const COPIED_RESET_TIMEOUT = 2000;

const formatWalletAddress = (address: string) => {
  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

export default function ReceiveSheet({
  trigger,
  open,
  onOpenChange,
}: ReceiveSheetProps) {
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const surfaceColor = useSignal(themeSignals.backgroundColor) ?? FALLBACKS.surface;
  const borderColor = useSignal(themeSignals.sectionSeparatorColor) ?? FALLBACKS.border;
  const textColor = useSignal(themeSignals.textColor) ?? FALLBACKS.text;
  const buttonColor = useSignal(themeSignals.buttonColor);
  const buttonTextColor = useSignal(themeSignals.buttonTextColor);

  const modalStyle = useMemo(
    () =>
      ({
        "--tgui--bg_color": surfaceColor,
        "--tgui--divider": surfaceColor,
      }) as CSSProperties,
    [surfaceColor],
  );

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), COPIED_RESET_TIMEOUT);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  useEffect(() => {
    let isMounted = true;

    const loadAddress = async () => {
      setIsLoading(true);

      try {
        const publicKey = await getWalletPublicKey();

        if (isMounted) {
          setAddress(publicKey.toBase58());
        }
      } catch (error) {
        console.error("Failed to fetch wallet address", error);

        if (isMounted) {
          setAddress(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAddress();

    return () => {
      isMounted = false;
    };
  }, []);

  const copyAddress = useCallback(async () => {
    if (!address) return;

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API is not available");
      }

      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy wallet address", error);
    }
  }, [address]);

  const copyButton = useMemo(
    () => (
      <Button
        mode="filled"
        size="s"
        onClick={copyAddress}
        aria-label="Copy wallet address"
        disabled={!address || isLoading}
        style={
          {
            ...(buttonColor
              ? {
                  "--tgui--button_color": buttonColor,
                }
              : {}),
            ...(buttonTextColor
              ? {
                  "--tgui--button_text_color": buttonTextColor,
                }
              : {}),
          } as CSSProperties
        }
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    ),
    [copied, copyAddress, buttonColor, buttonTextColor, address, isLoading],
  );

  const displayAddress = useMemo(() => {
    if (isLoading) return "Loading…";
    if (!address) return "—";

    return formatWalletAddress(address);
  }, [address, isLoading]);

  return (
    <Modal
      aria-label="Receive assets"
      trigger={trigger === undefined ? DEFAULT_TRIGGER : trigger}
      open={open}
      onOpenChange={onOpenChange}
      style={modalStyle}
      header={
        <Modal.Header
          after={
            <Modal.Close aria-label="Close receive sheet">
              <Icon28Close style={{ color: textColor }} />
            </Modal.Close>
          }
        >
          Receive
        </Modal.Header>
      }
    >
      <div
        style={{
          backgroundColor: surfaceColor,
          padding: "16px 0",
        }}
      >
        <Drawer.Title asChild>
          <VisuallyHidden>Receive assets</VisuallyHidden>
        </Drawer.Title>
        <List
          style={{
            width: "100%",
            margin: "0 auto",
            maxWidth: 420,
            background: surfaceColor,
            color: textColor,
            borderRadius: "var(--tgui--border_radius_m)",
            border: `1px solid ${borderColor}`,
            padding: 16,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Cell
            subtitle={displayAddress}
            after={copyButton}
            interactiveAnimation="opacity"
          >
            Address
          </Cell>
        </List>
      </div>
    </Modal>
  );
}
