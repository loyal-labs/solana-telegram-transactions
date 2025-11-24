"use client";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Icon28Close } from "@telegram-apps/telegram-ui/dist/icons/28/close";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import { ArrowDown } from "lucide-react";
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

// Inset surface for display-only content
const surfaceInset: CSSProperties = {
  background: "rgba(0, 0, 0, 0.2)",
  border: "1px solid rgba(0, 0, 0, 0.3)",
  borderTopColor: "rgba(0, 0, 0, 0.4)",
  boxShadow: "0 1px 0 0 rgba(255,255,255,0.03), 0 2px 8px -2px rgba(0,0,0,0.5) inset",
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
        "--tgui--bg_color": "transparent",
        "--tgui--divider": "rgba(255, 255, 255, 0.04)",
      }) as CSSProperties,
    [],
  );

  if (!transaction) {
    return null;
  }

  const formattedAmount = (transaction.amountLamports / LAMPORTS_PER_SOL).toFixed(4);

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
              <Icon28Close style={{ color: "rgba(255, 255, 255, 0.5)" }} />
            </Modal.Close>
          }
          style={{
            background: "linear-gradient(180deg, #1c1f26 0%, #151820 100%)",
            color: "rgba(255, 255, 255, 0.9)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
          }}
        >
          Claim Transaction
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
          <VisuallyHidden>Transaction details</VisuallyHidden>
        </Drawer.Title>
        <div
          style={{
            width: "100%",
            margin: "0 auto",
            maxWidth: 420,
          }}
        >
          {/* Amount Hero Section */}
          <div style={{
            textAlign: "center",
            marginBottom: "28px",
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(180deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              marginBottom: "16px",
            }}>
              <ArrowDown size={28} color="rgba(16, 185, 129, 1)" strokeWidth={2} />
            </div>
            <p style={{
              color: "rgba(16, 185, 129, 1)",
              fontSize: "32px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.02em",
            }}>
              +{formattedAmount} SOL
            </p>
            <p style={{
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: "13px",
              marginTop: "6px",
              margin: "6px 0 0 0",
            }}>
              Ready to claim
            </p>
          </div>

          {/* Sender Address - inset surface */}
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
              From
            </label>
            <div style={{
              ...surfaceInset,
              padding: "14px 16px",
              borderRadius: "12px",
            }}>
              <p style={{
                color: "rgba(255, 255, 255, 0.7)",
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
