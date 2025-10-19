"use client";
import { useSignal } from "@telegram-apps/sdk-react";
import { Button, Input, List, Modal, VisuallyHidden } from "@telegram-apps/telegram-ui";
import { Icon28Close } from "@telegram-apps/telegram-ui/dist/icons/28/close";
import { Drawer } from "@xelene/vaul-with-scroll-fix";
import { type CSSProperties, type ReactNode, useMemo, useState } from "react";

import { themeSignals } from "@/lib/telegram/theme";

export type SendSheetProps = {
  trigger?: ReactNode | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DEFAULT_TRIGGER = <Button size="m">Open modal</Button>;

const FALLBACKS = {
  surface: "var(--tg-theme-bg-color, #ffffff)",
  background: "var(--tg-theme-secondary-bg-color, rgba(15, 23, 42, 0.04))",
  border: "var(--tg-theme-section-separator-color, rgba(15, 23, 42, 0.08))",
  text: "var(--tg-theme-text-color, #1f2937)",
} as const;

export default function SendSheet({ trigger, open, onOpenChange }: SendSheetProps) {
  const [sum, setSum] = useState("");
  const [recipient, setRecipient] = useState("");

  const surfaceColor = useSignal(themeSignals.backgroundColor) ?? FALLBACKS.surface;
  const borderColor = useSignal(themeSignals.sectionSeparatorColor) ?? FALLBACKS.border;
  const textColor = useSignal(themeSignals.textColor) ?? FALLBACKS.text;

  const modalStyle = useMemo(
    () =>
      ({
        "--tgui--bg_color": surfaceColor,
        "--tgui--divider": surfaceColor,
      }) as CSSProperties,
    [surfaceColor],
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
              <Icon28Close style={{ color: textColor }} />
            </Modal.Close>
          }
        >
          Send
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
          <VisuallyHidden>Send assets</VisuallyHidden>
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
          <Input
            header="Sum"
            placeholder="Enter amount"
            value={sum}
            onChange={(event) => setSum(event.target.value)}
          />
          <Input
            header="Recipient"
            placeholder="Username, phone, or wallet"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
          />
        </List>
      </div>
    </Modal>
  );
}
