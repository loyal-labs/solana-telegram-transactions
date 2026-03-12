"use client";

import { ArrowUpRight, RefreshCw, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import type { WalletDesktopData } from "@/hooks/use-wallet-desktop-data";

import { AllActivityView } from "./all-activity-view";
import { AllTokensView } from "./all-tokens-view";
import { PortfolioContent } from "./portfolio-content";
import { SendContent } from "./send-content";
import { SwapContent } from "./swap-content";
import { TokenSelectView } from "./token-select-view";
import { TransactionDetailView } from "./transaction-detail-view";
import type {
  RightSidebarTab,
  SubView,
  SwapToken,
  TransactionDetail,
} from "./types";
import { swapTokens } from "./types";

export type { RightSidebarTab } from "./types";

export interface HeroRightSidebarProps {
  isOpen: boolean;
  activeTab: RightSidebarTab;
  onClose: () => void;
  onTabChange: (tab: RightSidebarTab) => void;
  isBalanceHidden: boolean;
  onBalanceHiddenChange: (hidden: boolean) => void;
  showQuickActions?: boolean;
  walletDesktopData: WalletDesktopData;
}

export function HeroRightSidebar(props: HeroRightSidebarProps) {
  const [subView, setSubView] = useState<SubView>(null);
  const [listSubView, setListSubView] = useState<"allTokens" | "allActivity" | null>(
    null
  );

  // Cross-fade when switching tabs: fade out → swap content → fade in
  const [crossFadeOpacity, setCrossFadeOpacity] = useState(1);
  const [displayTab, setDisplayTab] = useState(props.activeTab);
  useEffect(() => {
    if (props.activeTab !== displayTab) {
      setCrossFadeOpacity(0); // fade out
      const t = setTimeout(() => {
        setDisplayTab(props.activeTab); // swap content while near-invisible
        setCrossFadeOpacity(1); // fade in
      }, 200);
      return () => clearTimeout(t);
    }
  }, [props.activeTab, displayTab]);

  // Swap token state (lifted here so token selection sub-view can update it)
  const [swapFromToken, setSwapFromToken] = useState<SwapToken>(swapTokens[0]);
  const [swapToToken, setSwapToToken] = useState<SwapToken>(swapTokens[1]);

  // Send token state
  const [sendToken, setSendToken] = useState<SwapToken>(swapTokens[0]);

  // Derived state
  const isTransaction =
    typeof subView === "object" && subView?.type === "transaction";
  const isTokenSelect =
    typeof subView === "object" && subView?.type === "tokenSelect";
  const isSendTokenSelect =
    typeof subView === "object" && subView?.type === "sendTokenSelect";
  const hasLevel1 =
    subView === "allTokens" ||
    subView === "allActivity" ||
    isTransaction ||
    isTokenSelect ||
    isSendTokenSelect;
  const hasLevel2 = isTransaction;

  // Keep listSubView in sync
  useEffect(() => {
    if (subView === "allTokens" || subView === "allActivity") {
      setListSubView(subView);
    } else if (subView === null) {
      const t = setTimeout(() => setListSubView(null), 350);
      return () => clearTimeout(t);
    }
  }, [subView]);

  // Reset everything when sidebar closes
  useEffect(() => {
    if (!props.isOpen) {
      const t = setTimeout(() => {
        setSubView(null);
        setListSubView(null);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [props.isOpen]);

  const handleTokenSelect = useCallback(
    (token: SwapToken) => {
      if (typeof subView === "object" && subView?.type === "tokenSelect") {
        if (subView.field === "from") {
          // If selecting the same token as "to", swap them
          if (token.symbol === swapToToken.symbol) {
            setSwapToToken(swapFromToken);
          }
          setSwapFromToken(token);
        } else {
          if (token.symbol === swapFromToken.symbol) {
            setSwapFromToken(swapToToken);
          }
          setSwapToToken(token);
        }
      }
    },
    [subView, swapFromToken, swapToToken],
  );

  return (
    <>
      <style jsx>{`
        .right-sidebar-close:hover {
          background: rgba(0, 0, 0, 0.08) !important;
        }
        .show-all-btn:hover {
          background: rgba(249, 54, 60, 0.22) !important;
        }
        .quick-action-btn:hover {
          background: rgba(0, 0, 0, 0.06) !important;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          top: "8px",
          right: "8px",
          bottom: "8px",
          zIndex: 110,
          pointerEvents: props.isOpen ? "auto" : "none",
        }}
      >
        <div
          style={{
            width: "398px",
            height: "100%",
            position: "relative",
            transform: props.isOpen ? "translateX(0)" : "translateX(110%)",
            opacity: props.isOpen ? 1 : 0,
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Layer 0: Main panel */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: hasLevel1 ? "#EBEBEB" : "#F5F5F5",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transform: hasLevel1 ? "translateX(-6px)" : "translateX(0)",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: hasLevel1 ? "none" : "auto",
            }}
          >
            {/* Quick action buttons — shown when hero cards are not visible */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                padding: props.showQuickActions ? "8px 8px 0" : "0 8px",
                maxHeight: props.showQuickActions ? "52px" : "0",
                opacity: props.showQuickActions ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {(["portfolio", "send", "swap"] as const).map((tab) => (
                <button
                  className="quick-action-btn"
                  key={tab}
                  onClick={() => props.onTabChange(tab)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 0",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: props.activeTab === tab ? "rgba(0, 0, 0, 0.06)" : "rgba(0, 0, 0, 0.02)",
                    transition: "background 0.2s ease",
                  }}
                >
                  {tab === "portfolio" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      paddingRight: "2px",
                    }}
                  >
                      <div style={{ width: "20px", height: "20px", borderRadius: "9999px", border: "1.5px solid white", overflow: "hidden", marginRight: "-6px", position: "relative", zIndex: 2 }}>
                        <Image alt="USDC" height={20} src="/hero-new/usdc.png" style={{ width: "100%", height: "100%", objectFit: "cover" }} width={20} />
                      </div>
                      <div style={{ width: "20px", height: "20px", borderRadius: "9999px", border: "1.5px solid white", overflow: "hidden", position: "relative", zIndex: 1 }}>
                        <Image alt="SOL" height={20} src="/hero-new/solana.png" style={{ width: "100%", height: "100%", objectFit: "cover" }} width={20} />
                      </div>
                    </div>
                  )}
                  {tab === "send" && <ArrowUpRight size={16} style={{ color: "#F9363C" }} />}
                  {tab === "swap" && <RefreshCw size={16} style={{ color: "#F9363C" }} />}
                  <span style={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: "13px", fontWeight: 500, lineHeight: "16px", color: "#000" }}>
                    {tab === "portfolio" ? "Portfolio" : tab === "send" ? "Send" : "Swap"}
                  </span>
                </button>
              ))}
            </div>

            {/* Content wrapper for cross-fade (bg stays solid) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                opacity: crossFadeOpacity,
                transition: "opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {displayTab === "portfolio" && (
                <>
                  <button
                    className="right-sidebar-close"
                    onClick={props.onClose}
                    style={{
                      position: "absolute",
                      top: props.showQuickActions ? "56px" : "8px",
                      right: "8px",
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      background: "rgba(0, 0, 0, 0.04)",
                      border: "none",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      transition: "top 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease",
                      color: "#3C3C43",
                      zIndex: 2,
                    }}
                  >
                    <X size={24} />
                  </button>
                  <PortfolioContent
                    activityRows={props.walletDesktopData.activityRows}
                    balanceFraction={props.walletDesktopData.balanceFraction}
                    balanceSolLabel={props.walletDesktopData.balanceSolLabel}
                    balanceWhole={props.walletDesktopData.balanceWhole}
                    isBalanceHidden={props.isBalanceHidden}
                    isLoading={props.walletDesktopData.isLoading}
                    onBalanceHiddenChange={props.onBalanceHiddenChange}
                    onNavigate={setSubView}
                    tokenRows={props.walletDesktopData.tokenRows}
                    transactionDetails={props.walletDesktopData.transactionDetails}
                    walletLabel={props.walletDesktopData.walletLabel}
                  />
                </>
              )}
              {displayTab === "send" && (
                <SendContent
                  onClose={props.onClose}
                  onDone={() => props.onTabChange("portfolio")}
                  onNavigate={setSubView}
                  token={sendToken}
                />
              )}
              {displayTab === "swap" && (
                <SwapContent
                  fromToken={swapFromToken}
                  onClose={props.onClose}
                  onDone={() => props.onTabChange("portfolio")}
                  onFromTokenChange={setSwapFromToken}
                  onNavigate={setSubView}
                  onToTokenChange={setSwapToToken}
                  toToken={swapToToken}
                />
              )}
            </div>
          </div>

          {/* Layer 1: Sub-views (allTokens / allActivity / tokenSelect) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: hasLevel2 ? "#EBEBEB" : "#F5F5F5",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transform: hasLevel1
                ? hasLevel2
                  ? "translateX(-6px)"
                  : "translateX(0)"
                : "translateX(105%)",
              opacity: hasLevel1 ? 1 : 0,
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: hasLevel1 && !hasLevel2 ? "auto" : "none",
            }}
          >
            {listSubView === "allTokens" && (
                <AllTokensView
                  isBalanceHidden={props.isBalanceHidden}
                  onBack={() => setSubView(null)}
                  onClose={props.onClose}
                  tokens={props.walletDesktopData.allTokenRows}
                />
              )}
            {listSubView === "allActivity" && (
              <AllActivityView
                activities={props.walletDesktopData.allActivityRows}
                details={props.walletDesktopData.transactionDetails}
                isBalanceHidden={props.isBalanceHidden}
                onBack={() => setSubView(null)}
                onClose={props.onClose}
                onNavigate={setSubView}
              />
            )}
            {isTokenSelect && (
              <TokenSelectView
                currentToken={(subView as { type: "tokenSelect"; field: "from" | "to" }).field === "from" ? swapFromToken : swapToToken}
                onBack={() => setSubView(null)}
                onClose={props.onClose}
                onSelect={handleTokenSelect}
                title={(subView as { type: "tokenSelect"; field: "from" | "to" }).field === "from" ? "You Swap" : "You Receive"}
              />
            )}
            {isSendTokenSelect && (
              <TokenSelectView
                currentToken={sendToken}
                onBack={() => setSubView(null)}
                onClose={props.onClose}
                onSelect={(token) => setSendToken(token)}
                title="Send"
              />
            )}
          </div>

          {/* Layer 2: Transaction detail */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#F5F5F5",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transform: hasLevel2 ? "translateX(0)" : "translateX(105%)",
              opacity: hasLevel2 ? 1 : 0,
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: hasLevel2 ? "auto" : "none",
            }}
          >
            {isTransaction && (
              <TransactionDetailView
                detail={(subView as { type: "transaction"; detail: TransactionDetail; from: "portfolio" | "allActivity" }).detail}
                onBack={() => {
                  const from = (subView as { type: "transaction"; detail: TransactionDetail; from: "portfolio" | "allActivity" }).from;
                  setSubView(from === "allActivity" ? "allActivity" : null);
                }}
                onClose={props.onClose}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
