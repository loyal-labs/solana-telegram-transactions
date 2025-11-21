"use client";

import {
  Button,
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

import { getWalletPublicKey } from "@/lib/solana/wallet/wallet-details";

export type ReceiveSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DEFAULT_TRIGGER = <Button size="m">Receive</Button>;

const COPIED_RESET_TIMEOUT = 2000;

export default function ReceiveSheet({
  trigger,
  open,
  onOpenChange,
}: ReceiveSheetProps) {
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const displayAddress = useMemo(() => {
    if (isLoading) return "Loading…";
    if (!address) return "—";

    return address;
  }, [address, isLoading]);

  const modalStyle = useMemo(
    () =>
      ({
        "--tgui--bg_color": "#0a0a0a",
        "--tgui--divider": "rgba(255, 255, 255, 0.04)",
      }) as CSSProperties,
    [],
  );

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
              <Icon28Close style={{ color: "rgba(255, 255, 255, 0.6)" }} />
            </Modal.Close>
          }
          style={{
            background: "#0a0a0a",
            color: "rgba(255, 255, 255, 0.9)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.04)"
          }}
        >
          Receive
        </Modal.Header>
      }
    >
      <div
        style={{
          backgroundColor: "#0a0a0a",
          padding: "20px 16px",
        }}
      >
        <Drawer.Title asChild>
          <VisuallyHidden>Receive assets</VisuallyHidden>
        </Drawer.Title>
        <div
          style={{
            width: "100%",
            margin: "0 auto",
            maxWidth: 420,
          }}
        >
          <div>
            <label style={{
              display: "block",
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: "8px",
              fontWeight: 500
            }}>
              Wallet Address
            </label>
            <div style={{
              padding: "16px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px"
            }}>
              <p style={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "13px",
                fontFamily: "'JetBrains Mono', monospace",
                wordBreak: "break-all",
                flex: 1,
                margin: 0
              }}>
                {displayAddress}
              </p>
              <button
                onClick={copyAddress}
                disabled={!address || isLoading}
                style={{
                  padding: "8px 16px",
                  background: copied ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                  border: copied ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: "8px",
                  color: copied ? "rgba(16, 185, 129, 0.9)" : "rgba(99, 102, 241, 0.9)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: address && !isLoading ? "pointer" : "not-allowed",
                  opacity: address && !isLoading ? 1 : 0.5,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => {
                  if (address && !isLoading && !copied) {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.25)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copied) {
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)";
                  }
                }}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
