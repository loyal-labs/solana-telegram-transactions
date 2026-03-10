import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";

export const metadata: Metadata = {
  title: "loyal passkey",
  description: "Custom-domain passkey proxy flow for Squads Grid",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

const rootStyle: CSSProperties = {
  margin: "0 auto",
  maxWidth: 760,
  padding: "32px 20px 56px",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  color: "#0f172a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={rootStyle}>{children}</body>
    </html>
  );
}
