"use client";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Icon28Close } from "@telegram-apps/telegram-ui/dist/icons/28/close";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import {
  type CSSProperties,
  type ReactNode,
  useMemo,
} from "react";

export type TransactionDetailsSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  transaction: {
    id: string;
    amountLamports: number;
    sender: string;
  } | null;
};

export default function TransactionDetailsSheet({
  trigger,
  open,
  onOpenChange,
  transaction,
}: TransactionDetailsSheetProps) {
  const modalStyle = useMemo(
    () =>
      ({
        "--tgui--bg_color": "#0a0a0a",
        "--tgui--divider": "rgba(255, 255, 255, 0.04)",
      }) as CSSProperties,
    [],
  );

  if (!transaction) {
    return null;
  }

  return (
    <Modal
      aria-label="Transaction details"
      trigger={trigger === null ? null : trigger}
      open={open}
      onOpenChange={onOpenChange}
      style={modalStyle}
      header={
        <Modal.Header
          after={
            <Modal.Close aria-label="Close transaction details">
              <Icon28Close style={{ color: "rgba(255, 255, 255, 0.6)" }} />
            </Modal.Close>
          }
          style={{
            background: "#0a0a0a",
            color: "rgba(255, 255, 255, 0.9)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.04)"
          }}
        >
          Incoming Transaction
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
          <VisuallyHidden>Transaction details</VisuallyHidden>
        </Drawer.Title>
        <div
          style={{
            width: "100%",
            margin: "0 auto",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Amount */}
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
              Amount
            </label>
            <div style={{
              padding: "16px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
            }}>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "20px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "bold",
                  margin: 0,
                }}
              >
                {(transaction.amountLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
              </p>
            </div>
          </div>

          {/* Sender Address */}
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
              From
            </label>
            <div style={{
              padding: "16px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
            }}>
              <p style={{
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "13px",
                fontFamily: "'JetBrains Mono', monospace",
                wordBreak: "break-all",
                margin: 0,
                lineHeight: 1.5
              }}>
                {transaction.sender}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
