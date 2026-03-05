"use client";

import { useAccounts, useModal, usePhantom } from "@phantom/react-sdk";
import { useEffect, useState } from "react";

import { useChatMode } from "@/contexts/chat-mode-context";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const { isChatMode } = useChatMode();
  const { isConnected } = usePhantom();
  const { open } = useModal();
  const accounts = useAccounts();
  const solanaAddress = accounts?.find(
    (acc) => acc.addressType === "Solana"
  )?.address;

  // Truncate wallet address for display
  const truncatedAddress = solanaAddress
    ? `${solanaAddress.slice(0, 4)}...${solanaAddress.slice(-4)}`
    : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide when: chat mode AND connected (wallet button is in sidebar)
  const shouldHide = isChatMode && isConnected;

  if (!mounted || shouldHide) {
    return null;
  }

  return (
    <>
      <header className="header-wallet fixed top-6 right-6 z-[100]">
        <button
          onClick={() => open()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0, 0, 0, 0.04)",
            border: "none",
            borderRadius: "32px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            padding: "4px",
          }}
        >
          <img
            alt="Wallet"
            height={28}
            src="/Wallet-Icon.svg"
            style={{ borderRadius: "9999px" }}
            width={28}
          />
          <span
            style={{
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "20px",
              color: "#000",
              paddingRight: "12px",
            }}
          >
            {isConnected && truncatedAddress ? truncatedAddress : "Sign in"}
          </span>
        </button>
      </header>
      <style jsx>{`
        /* Mobile styles for header wallet button */
        @media (max-width: 767px) {
          .header-wallet {
            top: 16px !important;
            right: 8px !important;
            transition: opacity 0.2s ease;
          }
          .header-wallet button {
            height: 38px;
            padding: 5px !important;
          }
          .header-wallet button > div {
            width: 28px !important;
            height: 28px !important;
          }
          .header-wallet button > div img {
            width: 20px !important;
            height: 20px !important;
          }
        }

        /* Hide header when sidebar is open on mobile */
        @media (max-width: 767px) {
          :global(body.sidebar-open) .header-wallet {
            opacity: 0;
            pointer-events: none;
          }
        }
      `}</style>
    </>
  );
}
