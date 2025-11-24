"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Button,
  Modal,
  VisuallyHidden,
} from "@telegram-apps/telegram-ui";
import { Icon28Close } from "@telegram-apps/telegram-ui/dist/icons/28/close";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import { Check, Copy } from "lucide-react";

import { getWalletPublicKey } from "@/lib/solana/wallet/wallet-details";

export type ReceiveSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DEFAULT_TRIGGER = <Button size="m">Receive</Button>;

const COPIED_RESET_TIMEOUT = 2000;

// Shared styles for tactile surfaces
const surfaceRaised: CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderBottomColor: "rgba(0, 0, 0, 0.2)",
  boxShadow: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 -1px 0 0 rgba(0,0,0,0.1) inset, 0 4px 12px -2px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.2)",
};

const surfaceInset: CSSProperties = {
  background: "rgba(0, 0, 0, 0.2)",
  border: "1px solid rgba(0, 0, 0, 0.3)",
  borderTopColor: "rgba(0, 0, 0, 0.4)",
  boxShadow: "0 1px 0 0 rgba(255,255,255,0.03), 0 2px 8px -2px rgba(0,0,0,0.5) inset",
};

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
        "--tgui--bg_color": "transparent",
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
              <Icon28Close style={{ color: "rgba(255, 255, 255, 0.5)" }} />
            </Modal.Close>
          }
          style={{
            background: "linear-gradient(180deg, #1c1f26 0%, #151820 100%)",
            color: "rgba(255, 255, 255, 0.9)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
          }}
        >
          Receive
        </Modal.Header>
      }
    >
      <div
        style={{
          background: "linear-gradient(180deg, #151820 0%, #0d0e12 100%)",
          padding: "24px 20px 32px",
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
          {/* Wallet Address Section */}
          <div>
            <label style={{
              display: "block",
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "10px",
              fontWeight: 500
            }}>
              Your Wallet Address
            </label>

            {/* Address display - inset/recessed surface */}
            <div style={{
              ...surfaceInset,
              padding: "14px 16px",
              borderRadius: "12px",
              marginBottom: "16px",
            }}>
              <p style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "13px",
                fontFamily: "'JetBrains Mono', monospace",
                wordBreak: "break-all",
                margin: 0,
                lineHeight: 1.5,
              }}>
                {displayAddress}
              </p>
            </div>

            {/* Copy button - tactile raised surface */}
            <button
              onClick={copyAddress}
              disabled={!address || isLoading}
              style={{
                ...surfaceRaised,
                width: "100%",
                padding: "14px 20px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                color: copied ? "rgba(16, 185, 129, 1)" : "rgba(255, 255, 255, 0.9)",
                fontSize: "15px",
                fontWeight: 600,
                cursor: address && !isLoading ? "pointer" : "not-allowed",
                opacity: address && !isLoading ? 1 : 0.5,
                background: copied
                  ? "linear-gradient(180deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)"
                  : surfaceRaised.background,
                borderColor: copied ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)",
              }}
            >
              {copied ? (
                <>
                  <Check size={18} strokeWidth={2.5} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={18} strokeWidth={2} />
                  Copy Address
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
