"use client";
import { Button, Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Icon28Close } from "@telegram-apps/telegram-ui/dist/icons/28/close";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from "react";

export type SendSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialRecipient?: string;
  onValidationChange?: (isValid: boolean) => void;
  onFormValuesChange?: (values: { amount: string; recipient: string }) => void;
  showErrors?: boolean;
};

const DEFAULT_TRIGGER = <Button size="m">Open modal</Button>;

// Basic Solana address validation (base58, 32-44 chars)
export const isValidSolanaAddress = (address: string): boolean => {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  console.log("isValidSolanaAddress address:", address);
  const result = base58Regex.test(address);
  console.log("isValidSolanaAddress result:", result);
  return result;
};

// Telegram username validation (starts with @, 5-32 chars excluding @)
export const isValidTelegramUsername = (username: string): boolean => {
  if (!username.startsWith("@")) return false;
  const usernameWithoutAt = username.slice(1);
  const result = usernameWithoutAt.length >= 5 && usernameWithoutAt.length <= 32;
  console.log("isValidTelegramUsername result:", result);
  return result;
};

export default function SendSheet({
  trigger,
  open,
  onOpenChange,
  initialRecipient,
  onValidationChange,
  onFormValuesChange,
  showErrors,
}: SendSheetProps) {
  const [sum, setSum] = useState("");
  const [recipient, setRecipient] = useState("");

  // Check individual field validity for error display
  const isAmountInvalid = showErrors && (!sum.trim() || isNaN(parseFloat(sum)) || parseFloat(sum) <= 0);
  const isRecipientInvalid = showErrors && (!recipient.trim() || !(isValidSolanaAddress(recipient.trim()) || isValidTelegramUsername(recipient.trim())));

  // Update recipient when initialRecipient changes or when sheet opens
  useEffect(() => {
    if (open) {
      setRecipient(initialRecipient || "");
    }
  }, [initialRecipient, open]);

  // Clear fields when sheet closes
  useEffect(() => {
    if (!open) {
      setSum("");
      setRecipient("");
    }
  }, [open]);

  // Notify parent about current field values
  useEffect(() => {
    if (onFormValuesChange) {
      onFormValuesChange({ amount: sum, recipient });
    }
  }, [sum, recipient, onFormValuesChange]);

  // Validation effect
  useEffect(() => {
    if (!open) {
      // When sheet is closed, always invalid
      if (onValidationChange) {
        onValidationChange(false);
      }
      return;
    }

    // Check if fields are empty
    if (!sum.trim() || !recipient.trim()) {
      if (onValidationChange) {
        onValidationChange(false);
      }
      return;
    }

    const amount = parseFloat(sum);
    const isAmountValid = !isNaN(amount) && amount > 0;
    const isRecipientValid = isValidSolanaAddress(recipient.trim()) || isValidTelegramUsername(recipient.trim());

    const isValid = isAmountValid && isRecipientValid;

    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [sum, recipient, onValidationChange, open]);

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
      aria-label="Send assets"
      trigger={trigger === undefined ? DEFAULT_TRIGGER : trigger}
      open={open}
      onOpenChange={onOpenChange}
      style={modalStyle}
      header={
        <Modal.Header
          after={
            <Modal.Close aria-label="Close send sheet">
              <Icon28Close style={{ color: "rgba(255, 255, 255, 0.6)" }} />
            </Modal.Close>
          }
          style={{
            background: "#0a0a0a",
            color: "rgba(255, 255, 255, 0.9)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.04)"
          }}
        >
          Send
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
          <VisuallyHidden>Send assets</VisuallyHidden>
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
              Amount (in SOL)
            </label>
            <input
              type="text"
              placeholder="0.00"
              value={sum}
              onChange={(event) => setSum(event.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "rgba(255, 255, 255, 0.04)",
                border: isAmountInvalid ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "16px",
                fontFamily: "'JetBrains Mono', monospace",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.06)";
                if (!isAmountInvalid) {
                  e.target.style.borderColor = "rgba(99, 102, 241, 0.3)";
                }
              }}
              onBlur={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.04)";
                if (!isAmountInvalid) {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                }
              }}
            />
          </div>
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
              Recipient
            </label>
            <input
              type="text"
              placeholder="Wallet address or Telegram username (with @)"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "rgba(255, 255, 255, 0.04)",
                border: isRecipientInvalid ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.06)";
                if (!isRecipientInvalid) {
                  e.target.style.borderColor = "rgba(99, 102, 241, 0.3)";
                }
              }}
              onBlur={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.04)";
                if (!isRecipientInvalid) {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                }
              }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
