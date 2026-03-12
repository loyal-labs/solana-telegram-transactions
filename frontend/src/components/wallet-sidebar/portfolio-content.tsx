"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

import { ActivityRowItem } from "./activity-row-item";
import { TokenRowItem } from "./token-row-item";
import type {
  ActivityRow,
  SubView,
  TokenRow,
  TransactionDetail,
} from "./types";

export function PortfolioContent({
  activityRows,
  balanceFraction,
  balanceSolLabel,
  balanceWhole,
  isBalanceHidden,
  isLoading,
  onBalanceHiddenChange,
  onNavigate,
  tokenRows,
  transactionDetails,
  walletLabel,
}: {
  activityRows: ActivityRow[];
  balanceFraction: string;
  balanceSolLabel: string;
  balanceWhole: string;
  isBalanceHidden: boolean;
  isLoading: boolean;
  onBalanceHiddenChange: (hidden: boolean) => void;
  onNavigate: (view: SubView) => void;
  tokenRows: TokenRow[];
  transactionDetails: Record<string, TransactionDetail>;
  walletLabel: string;
}) {
  return (
    <>
      {/* SVG pixelation filters */}
      <svg
        aria-hidden="true"
        height="0"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        width="0"
      >
        <defs>
          <filter id="rs-pixelate-lg" x="0" y="0" width="100%" height="100%">
            <feFlood x="4" y="4" height="2" width="2" />
            <feComposite width="10" height="10" />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius="5" />
          </filter>
          <filter id="rs-pixelate-sm" x="0" y="0" width="100%" height="100%">
            <feFlood x="3" y="3" height="2" width="2" />
            <feComposite width="8" height="8" />
            <feTile result="a" />
            <feComposite in="SourceGraphic" in2="a" operator="in" />
            <feMorphology operator="dilate" radius="4" />
          </filter>
        </defs>
      </svg>

      {/* Balance section */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
          padding: "20px 20px 12px",
          borderRadius: "20px",
          width: "100%",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "12px",
            border: "0.533px solid rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Image
            alt="Wallet"
            height={64}
            src="/hero-new/Wallet-Cover.png"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            width={64}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "20px",
              color: "rgba(60, 60, 67, 0.6)",
            }}
          >
            {walletLabel}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div style={{ borderRadius: "8px", overflow: "hidden" }}>
              <span
                style={{
                  fontFamily: "var(--font-geist-sans), sans-serif",
                  fontSize: "28px",
                  fontWeight: 600,
                  lineHeight: "32px",
                  color: isBalanceHidden ? "#BBBBC0" : "#000",
                  filter: isBalanceHidden ? "url(#rs-pixelate-lg)" : "none",
                  transition: "filter 0.15s ease, color 0.15s ease",
                  userSelect: isBalanceHidden ? "none" : "auto",
                  display: "block",
                }}
              >
                {balanceWhole}
                <span
                  style={{
                    color: isBalanceHidden ? "#BBBBC0" : "rgba(60, 60, 67, 0.6)",
                    transition: "color 0.15s ease",
                  }}
                >
                  {balanceFraction}
                </span>
              </span>
            </div>
            <button
              onClick={() => onBalanceHiddenChange(!isBalanceHidden)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
              type="button"
            >
              {isBalanceHidden ? (
                <EyeOff
                  size={28}
                  strokeWidth={1.75}
                  style={{ color: "rgba(60, 60, 67, 0.6)" }}
                />
              ) : (
                <Eye
                  size={28}
                  strokeWidth={1.75}
                  style={{ color: "rgba(60, 60, 67, 0.6)" }}
                />
              )}
            </button>
          </div>
          <div style={{ borderRadius: "6px", overflow: "hidden" }}>
            <span
              style={{
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                lineHeight: "20px",
                color: isBalanceHidden ? "#C8C8CC" : "rgba(60, 60, 67, 0.6)",
                filter: isBalanceHidden ? "url(#rs-pixelate-sm)" : "none",
                transition: "filter 0.15s ease, color 0.15s ease",
                userSelect: isBalanceHidden ? "none" : "auto",
                display: "block",
              }}
            >
              {balanceSolLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Tokens section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "8px",
            width: "100%",
          }}
        >
          <div style={{ width: "100%", padding: "12px 12px 8px" }}>
            <span
              style={{
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                lineHeight: "20px",
                color: "#000",
                letterSpacing: "-0.176px",
              }}
            >
              Tokens
            </span>
          </div>

          {tokenRows.map((token) => (
            <TokenRowItem
              isBalanceHidden={isBalanceHidden}
              key={token.id ?? token.symbol}
              token={token}
            />
          ))}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "8px",
              width: "100%",
            }}
          >
            <button
              className="show-all-btn"
              onClick={() => onNavigate("allTokens")}
              style={{
                background: "rgba(249, 54, 60, 0.14)",
                border: "none",
                borderRadius: "9999px",
                padding: "8px 16px",
                cursor: "pointer",
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "15px",
                fontWeight: 400,
                lineHeight: "20px",
                color: "#000",
                textAlign: "center",
                transition: "background-color 0.15s ease",
              }}
              type="button"
            >
              Show All
            </button>
          </div>
        </div>

        {/* Activity section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "8px",
            width: "100%",
          }}
        >
          <div style={{ width: "100%", padding: "12px 12px 8px" }}>
            <span
              style={{
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                lineHeight: "20px",
                color: "#000",
                letterSpacing: "-0.176px",
              }}
            >
              Activity
            </span>
          </div>

          {activityRows.map((activity) => (
            <ActivityRowItem
              activity={activity}
              isBalanceHidden={isBalanceHidden}
              key={activity.id}
              onClick={() =>
                onNavigate({
                  type: "transaction",
                  detail: transactionDetails[activity.id],
                  from: "portfolio",
                })
              }
            />
          ))}

          {!isLoading && activityRows.length === 0 && (
            <div
              style={{
                padding: "12px 20px",
                textAlign: "center",
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "14px",
                color: "rgba(60, 60, 67, 0.6)",
              }}
            >
              No activity yet
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "8px",
              width: "100%",
            }}
          >
            <button
              className="show-all-btn"
              onClick={() => onNavigate("allActivity")}
              style={{
                background: "rgba(249, 54, 60, 0.14)",
                border: "none",
                borderRadius: "9999px",
                padding: "8px 16px",
                cursor: "pointer",
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "15px",
                fontWeight: 400,
                lineHeight: "20px",
                color: "#000",
                textAlign: "center",
                transition: "background-color 0.15s ease",
              }}
              type="button"
            >
              Show All
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
