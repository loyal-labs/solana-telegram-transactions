"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

import { useAuthCapability } from "@/lib/auth/capability";
import { useAuthSession } from "@/contexts/auth-session-context";
import { useChatMode } from "@/contexts/chat-mode-context";
import { useSignInModal } from "@/contexts/sign-in-modal-context";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const { isChatMode } = useChatMode();
  const { publicKey } = useWallet();
  const { hasWalletConnection } = useAuthCapability();
  const { user } = useAuthSession();
  const { open } = useSignInModal();

  const solanaAddress = publicKey?.toBase58();
  const sessionAddress = user?.displayAddress ?? null;
  const truncatedAddress = solanaAddress
    ? `${solanaAddress.slice(0, 4)}...${solanaAddress.slice(-4)}`
    : sessionAddress
      ? `${sessionAddress.slice(0, 4)}...${sessionAddress.slice(-4)}`
      : null;
  const emailLabel = user?.email ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide when: chat mode AND connected (wallet button is in sidebar)
  const shouldHide = isChatMode && hasWalletConnection;

  if (!mounted || shouldHide) {
    return null;
  }

  return (
    <>
      <header className="header-wallet fixed top-4 right-6 z-[100]">
        <button
          onClick={open}
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(0, 0, 0, 0.04)",
            border: "none",
            borderRadius: "32px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            padding: "8px 16px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "20px",
              color: "#000",
            }}
          >
            {hasWalletConnection && truncatedAddress
              ? truncatedAddress
              : emailLabel ?? "Sign In"}
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
