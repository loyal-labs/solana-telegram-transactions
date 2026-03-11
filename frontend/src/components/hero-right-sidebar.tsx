"use client";

import { ArrowLeft, Eye, EyeOff, Globe, Search, Share, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export type RightSidebarTab = "portfolio" | "send" | "swap";

export interface HeroRightSidebarProps {
  isOpen: boolean;
  activeTab: RightSidebarTab;
  onClose: () => void;
  isBalanceHidden: boolean;
  onBalanceHiddenChange: (hidden: boolean) => void;
}

interface TokenRow {
  symbol: string;
  price: string;
  amount: string;
  value: string;
  icon: string;
}

const tokens: TokenRow[] = [
  {
    symbol: "USDC",
    price: "$0.99",
    amount: "1,267",
    value: "$2.12",
    icon: "/hero-new/usdc.png",
  },
  {
    symbol: "SOL",
    price: "$99.03",
    amount: "1,267",
    value: "$2.12",
    icon: "/hero-new/solana.png",
  },
];

// Extended tokens for "Show All" view
const allTokens: TokenRow[] = [
  ...tokens,
  {
    symbol: "USDC",
    price: "$0.99",
    amount: "450",
    value: "$449.55",
    icon: "/hero-new/usdc.png",
  },
  {
    symbol: "SOL",
    price: "$99.03",
    amount: "3.5",
    value: "$346.61",
    icon: "/hero-new/solana.png",
  },
];

interface ActivityRow {
  id: string;
  type: "received" | "sent";
  counterparty: string;
  amount: string;
  timestamp: string;
  date: string;
  icon: string;
}

const allActivities: ActivityRow[] = [
  {
    id: "1",
    type: "received",
    counterparty: "UQAt…qZir",
    amount: "+200.00 USDC",
    timestamp: "2:58 PM",
    date: "November 25",
    icon: "/hero-new/usdc.png",
  },
  {
    id: "2",
    type: "sent",
    counterparty: "UQAt…qZir",
    amount: "\u22120.5 SOL",
    timestamp: "3:06 AM",
    date: "November 25",
    icon: "/hero-new/solana.png",
  },
  {
    id: "3",
    type: "received",
    counterparty: "HxR4…mK2p",
    amount: "+50.00 USDC",
    timestamp: "11:22 AM",
    date: "November 24",
    icon: "/hero-new/usdc.png",
  },
  {
    id: "4",
    type: "sent",
    counterparty: "3vBt…nW8q",
    amount: "\u22121.2 SOL",
    timestamp: "9:15 AM",
    date: "November 24",
    icon: "/hero-new/solana.png",
  },
  {
    id: "5",
    type: "received",
    counterparty: "UQAt…qZir",
    amount: "+100.00 USDC",
    timestamp: "4:30 PM",
    date: "November 23",
    icon: "/hero-new/usdc.png",
  },
];

// Subset for portfolio overview
const activities = allActivities.slice(0, 2).map((a) => ({
  ...a,
  timestamp: `${a.date.split(" ")[0].slice(0, 3)} ${a.date.split(" ")[1]}, ${a.timestamp}`,
}));

interface TransactionDetail {
  activity: ActivityRow;
  usdValue: string;
  status: string;
  networkFee: string;
  networkFeeUsd: string;
}

type SubView = null | "allTokens" | "allActivity" | { type: "transaction"; detail: TransactionDetail; from: "portfolio" | "allActivity" };

function activityToDetail(activity: ActivityRow): TransactionDetail {
  // Mock USD values and fees for demo
  const usdMap: Record<string, string> = {
    USDC: "$1.00",
    SOL: "$99.03",
  };
  const token = activity.amount.includes("USDC") ? "USDC" : "SOL";
  const numericAmount = Number.parseFloat(
    activity.amount.replace(/[^0-9.]/g, ""),
  );
  const usdValue = `$${(numericAmount * (token === "SOL" ? 99.03 : 1)).toFixed(2)}`;

  return {
    activity,
    usdValue,
    status: "Completed",
    networkFee: "0.00005 SOL",
    networkFeeUsd: "$0.00",
  };
}

function SearchInput({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ padding: "8px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(0, 0, 0, 0.04)",
          borderRadius: "47px",
          padding: "0 16px",
          gap: "8px",
          height: "44px",
        }}
      >
        <Search
          size={24}
          style={{ color: "rgba(60, 60, 67, 0.6)", flexShrink: 0 }}
        />
        <input
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "20px",
            color: "#000",
            padding: 0,
          }}
          type="text"
          value={value}
        />
      </div>
    </div>
  );
}

function SubViewHeader({
  title,
  onBack,
  onClose,
}: {
  title: string;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <style jsx>{`
        .subview-back:hover {
          background: rgba(0, 0, 0, 0.08) !important;
        }
        .subview-close:hover {
          background: rgba(0, 0, 0, 0.08) !important;
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px",
        }}
      >
        <button
          className="subview-back"
          onClick={onBack}
          style={{
            width: "36px",
            height: "36px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(0, 0, 0, 0.04)",
            border: "none",
            borderRadius: "9999px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            color: "#3C3C43",
          }}
          type="button"
        >
          <ArrowLeft size={24} />
        </button>
        <span
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "18px",
            fontWeight: 600,
            lineHeight: "28px",
            color: "#000",
          }}
        >
          {title}
        </span>
        <button
          className="subview-close"
          onClick={onClose}
          style={{
            width: "36px",
            height: "36px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(0, 0, 0, 0.04)",
            border: "none",
            borderRadius: "9999px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            color: "#3C3C43",
          }}
          type="button"
        >
          <X size={24} />
        </button>
      </div>
    </>
  );
}

function TokenRowItem({
  token,
  isBalanceHidden,
}: {
  token: TokenRow;
  isBalanceHidden: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        borderRadius: "16px",
        width: "100%",
        overflow: "hidden",
        background: hovered ? "rgba(0, 0, 0, 0.04)" : "transparent",
        transition: "background-color 0.15s ease",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingRight: "12px",
          paddingTop: "6px",
          paddingBottom: "6px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <Image
            alt={token.symbol}
            height={48}
            src={token.icon}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            width={48}
          />
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          padding: "10px 0",
          minWidth: 0,
        }}
      >
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
          {token.symbol}
        </span>
        <span
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "16px",
            color: "rgba(60, 60, 67, 0.6)",
          }}
        >
          {token.price}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "10px 0",
          paddingLeft: "12px",
          flexShrink: 0,
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "20px",
            color: isBalanceHidden ? "#BBBBC0" : "#000",
            textAlign: "right",
            filter: isBalanceHidden ? "url(#rs-pixelate-sm)" : "none",
            transition: "filter 0.15s ease, color 0.15s ease",
            userSelect: isBalanceHidden ? "none" : "auto",
          }}
        >
          {token.amount}
        </span>
        <span
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "16px",
            color: isBalanceHidden ? "#C8C8CC" : "rgba(60, 60, 67, 0.6)",
            filter: isBalanceHidden ? "url(#rs-pixelate-sm)" : "none",
            transition: "filter 0.15s ease, color 0.15s ease",
            userSelect: isBalanceHidden ? "none" : "auto",
          }}
        >
          {token.value}
        </span>
      </div>
    </div>
  );
}

function ActivityRowItem({
  activity,
  isBalanceHidden,
  onClick,
}: {
  activity: ActivityRow | (typeof activities)[number];
  isBalanceHidden: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        borderRadius: "16px",
        width: "100%",
        overflow: "hidden",
        background: hovered ? "rgba(0, 0, 0, 0.04)" : "transparent",
        transition: "background-color 0.15s ease",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingRight: "12px",
          paddingTop: "6px",
          paddingBottom: "6px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "9999px",
            overflow: "hidden",
          }}
        >
          <Image
            alt={activity.type}
            height={48}
            src={activity.icon}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            width={48}
          />
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          padding: "10px 0",
          minWidth: 0,
        }}
      >
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
          {activity.type === "received" ? "Received" : "Sent"}
        </span>
        <span
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "16px",
            color: "rgba(60, 60, 67, 0.6)",
          }}
        >
          {activity.type === "received" ? "from" : "to"}{" "}
          {activity.counterparty}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "10px 0",
          paddingLeft: "12px",
          flexShrink: 0,
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "20px",
            color: isBalanceHidden
              ? "#BBBBC0"
              : activity.type === "received"
                ? "#34C759"
                : "#000",
            textAlign: "right",
            filter: isBalanceHidden ? "url(#rs-pixelate-sm)" : "none",
            transition: "filter 0.15s ease, color 0.15s ease",
            userSelect: isBalanceHidden ? "none" : "auto",
            whiteSpace: "nowrap",
          }}
        >
          {activity.amount}
        </span>
        <span
          style={{
            fontFamily: "var(--font-geist-sans), sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "16px",
            color: "rgba(60, 60, 67, 0.6)",
            whiteSpace: "nowrap",
          }}
        >
          {activity.timestamp}
        </span>
      </div>
    </div>
  );
}

function AllTokensView({
  isBalanceHidden,
  onBack,
  onClose,
}: {
  isBalanceHidden: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = allTokens.filter((t) =>
    t.symbol.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SubViewHeader onBack={onBack} onClose={onClose} title="Tokens" />
      <SearchInput onChange={setSearch} value={search} />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "0 8px",
        }}
      >
        {filtered.map((token, i) => (
          <TokenRowItem
            isBalanceHidden={isBalanceHidden}
            key={`${token.symbol}-${i}`}
            token={token}
          />
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              padding: "32px 20px",
              textAlign: "center",
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontSize: "14px",
              color: "rgba(60, 60, 67, 0.6)",
            }}
          >
            No tokens found
          </div>
        )}
      </div>
    </div>
  );
}

function AllActivityView({
  isBalanceHidden,
  onBack,
  onClose,
  onNavigate,
}: {
  isBalanceHidden: boolean;
  onBack: () => void;
  onClose: () => void;
  onNavigate: (view: SubView) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = allActivities.filter(
    (a) =>
      a.counterparty.toLowerCase().includes(search.toLowerCase()) ||
      a.amount.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()),
  );

  // Group by date
  const grouped: { date: string; items: ActivityRow[] }[] = [];
  for (const item of filtered) {
    const existing = grouped.find((g) => g.date === item.date);
    if (existing) {
      existing.items.push(item);
    } else {
      grouped.push({ date: item.date, items: [item] });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SubViewHeader onBack={onBack} onClose={onClose} title="Activity" />
      <SearchInput onChange={setSearch} value={search} />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "0 8px",
        }}
      >
        {grouped.map((group) => (
          <div key={group.date}>
            {/* Date header */}
            <div style={{ padding: "12px 12px 8px" }}>
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
                {group.date}
              </span>
            </div>
            {group.items.map((activity) => (
              <ActivityRowItem
                activity={{ ...activity, timestamp: activity.timestamp }}
                isBalanceHidden={isBalanceHidden}
                key={activity.id}
                onClick={() =>
                  onNavigate({
                    type: "transaction",
                    detail: activityToDetail(activity),
                    from: "allActivity",
                  })
                }
              />
            ))}
          </div>
        ))}
        {grouped.length === 0 && (
          <div
            style={{
              padding: "32px 20px",
              textAlign: "center",
              fontFamily: "var(--font-geist-sans), sans-serif",
              fontSize: "14px",
              color: "rgba(60, 60, 67, 0.6)",
            }}
          >
            No activity found
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionDetailView({
  detail,
  onBack,
  onClose,
}: {
  detail: TransactionDetail;
  onBack: () => void;
  onClose: () => void;
}) {
  const isSent = detail.activity.type === "sent";
  const title = isSent ? "Sent" : "Received";
  // Strip the +/− prefix for the large display
  const rawAmount = detail.activity.amount.replace(/^[+\u2212-]/, "");
  const parts = rawAmount.split(" ");
  const amountNum = parts[0];
  const amountToken = parts[1] || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <style jsx>{`
        .tx-action-btn:hover {
          background: rgba(249, 54, 60, 0.22) !important;
        }
        .tx-back-btn:hover,
        .tx-close-btn:hover {
          background: rgba(0, 0, 0, 0.08) !important;
        }
      `}</style>

      {/* Header */}
      <SubViewHeader onBack={onBack} onClose={onClose} title={title} />

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "8px",
          overflowY: "auto",
        }}
      >
        {/* Amount hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 12px 24px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontSize: "40px",
                  lineHeight: "48px",
                  color: isSent ? "#000" : "#34C759",
                }}
              >
                {isSent ? "\u2212" : "+"}{amountNum}
              </span>
              <span
                style={{
                  fontSize: "28px",
                  lineHeight: "32px",
                  color: "rgba(60, 60, 67, 0.4)",
                  letterSpacing: "0.4px",
                }}
              >
                {amountToken}
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "16px",
                fontWeight: 400,
                lineHeight: "20px",
                color: "rgba(60, 60, 67, 0.6)",
              }}
            >
              ≈{detail.usdValue}
            </span>
            <span
              style={{
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "16px",
                fontWeight: 400,
                lineHeight: "20px",
                color: "rgba(60, 60, 67, 0.6)",
              }}
            >
              {detail.activity.date}, {detail.activity.timestamp}
            </span>
          </div>
        </div>

        {/* Details card */}
        <div style={{ width: "100%" }}>
          <div
            style={{
              background: "rgba(0, 0, 0, 0.04)",
              borderRadius: "16px",
              padding: "4px 0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Status */}
            <div style={{ padding: "9px 12px" }}>
              <span
                style={{
                  fontFamily: "var(--font-geist-sans), sans-serif",
                  fontSize: "13px",
                  fontWeight: 400,
                  lineHeight: "16px",
                  color: "rgba(60, 60, 67, 0.6)",
                  display: "block",
                }}
              >
                Status
              </span>
              <span
                style={{
                  fontFamily: "var(--font-geist-sans), sans-serif",
                  fontSize: "16px",
                  fontWeight: 400,
                  lineHeight: "20px",
                  color: "#000",
                  display: "block",
                  marginTop: "2px",
                }}
              >
                {detail.status}
              </span>
            </div>

            {/* Sender / Recipient */}
            <div style={{ padding: "9px 12px" }}>
              <span
                style={{
                  fontFamily: "var(--font-geist-sans), sans-serif",
                  fontSize: "13px",
                  fontWeight: 400,
                  lineHeight: "16px",
                  color: "rgba(60, 60, 67, 0.6)",
                  display: "block",
                }}
              >
                {isSent ? "Recipient" : "Sender"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-geist-sans), sans-serif",
                  fontSize: "16px",
                  fontWeight: 400,
                  lineHeight: "20px",
                  color: "#000",
                  display: "block",
                  marginTop: "2px",
                }}
              >
                {detail.activity.counterparty}
              </span>
            </div>

            {/* Network Fee */}
            <div style={{ padding: "9px 12px" }}>
              <span
                style={{
                  fontFamily: "var(--font-geist-sans), sans-serif",
                  fontSize: "13px",
                  fontWeight: 400,
                  lineHeight: "16px",
                  color: "rgba(60, 60, 67, 0.6)",
                  display: "block",
                }}
              >
                Network Fee
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "2px",
                  fontFamily: "var(--font-geist-sans), sans-serif",
                  fontSize: "16px",
                  fontWeight: 400,
                  lineHeight: "20px",
                }}
              >
                <span style={{ color: "#000" }}>{detail.networkFee}</span>
                <span style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                  ≈ {detail.networkFeeUsd}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingTop: "20px",
            paddingBottom: "16px",
            width: "100%",
          }}
        >
          {/* View in explorer */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <button
              className="tx-action-btn"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "9999px",
                background: "rgba(249, 54, 60, 0.14)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              type="button"
            >
              <Globe size={24} style={{ color: "#3C3C43" }} />
            </button>
            <span
              style={{
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "13px",
                fontWeight: 400,
                lineHeight: "16px",
                color: "rgba(60, 60, 67, 0.6)",
                textAlign: "center",
              }}
            >
              View in explorer
            </span>
          </div>

          {/* Share */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <button
              className="tx-action-btn"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "9999px",
                background: "rgba(249, 54, 60, 0.14)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              type="button"
            >
              <Share size={24} style={{ color: "#3C3C43" }} />
            </button>
            <span
              style={{
                fontFamily: "var(--font-geist-sans), sans-serif",
                fontSize: "13px",
                fontWeight: 400,
                lineHeight: "16px",
                color: "rgba(60, 60, 67, 0.6)",
                textAlign: "center",
              }}
            >
              Share
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioContent({
  isBalanceHidden,
  onBalanceHiddenChange,
  onNavigate,
}: {
  isBalanceHidden: boolean;
  onBalanceHiddenChange: (hidden: boolean) => void;
  onNavigate: (view: SubView) => void;
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
            UQAt…qZir · Mainnet
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
                $1,267
                <span
                  style={{
                    color: isBalanceHidden ? "#BBBBC0" : "rgba(60, 60, 67, 0.6)",
                    transition: "color 0.15s ease",
                  }}
                >
                  .47
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
              14.98765 SOL
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

          {tokens.map((token) => (
            <TokenRowItem
              isBalanceHidden={isBalanceHidden}
              key={token.symbol}
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

          {activities.map((activity) => (
            <ActivityRowItem
              activity={activity}
              isBalanceHidden={isBalanceHidden}
              key={activity.id}
              onClick={() =>
                onNavigate({
                  type: "transaction",
                  detail: activityToDetail(activity),
                  from: "portfolio",
                })
              }
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

function SendContent() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-geist-sans), sans-serif",
          fontSize: "16px",
          fontWeight: 400,
          lineHeight: "20px",
          color: "rgba(60, 60, 67, 0.6)",
        }}
      >
        Send — coming soon
      </span>
    </div>
  );
}

function SwapContent() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-geist-sans), sans-serif",
          fontSize: "16px",
          fontWeight: 400,
          lineHeight: "20px",
          color: "rgba(60, 60, 67, 0.6)",
        }}
      >
        Swap — coming soon
      </span>
    </div>
  );
}

export function HeroRightSidebar(props: HeroRightSidebarProps) {
  const [subView, setSubView] = useState<SubView>(null);
  // Track the "level 1" sub-view so it stays rendered behind the transaction detail
  const [listSubView, setListSubView] = useState<"allTokens" | "allActivity" | null>(null);

  // Derived state
  const isTransaction = typeof subView === "object" && subView?.type === "transaction";
  const hasLevel1 = subView === "allTokens" || subView === "allActivity" || isTransaction;
  const hasLevel2 = isTransaction;

  // Keep listSubView in sync
  useEffect(() => {
    if (subView === "allTokens" || subView === "allActivity") {
      setListSubView(subView);
    } else if (subView === null) {
      // Delay clearing so the slide-out animation plays
      const t = setTimeout(() => setListSubView(null), 350);
      return () => clearTimeout(t);
    }
    // When subView is a transaction object, keep listSubView as-is (it stays rendered behind)
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

  return (
    <>
      <style jsx>{`
        .right-sidebar-close:hover {
          background: rgba(0, 0, 0, 0.08) !important;
        }
        .show-all-btn:hover {
          background: rgba(249, 54, 60, 0.22) !important;
        }
      `}</style>

      {/* Right Sidebar Panel */}
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
            transition:
              "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
            {/* Close button */}
            <button
              className="right-sidebar-close"
              onClick={props.onClose}
              style={{
                position: "absolute",
                top: "8px",
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
                transition: "all 0.2s ease",
                color: "#3C3C43",
                zIndex: 2,
              }}
            >
              <X size={24} />
            </button>

            {props.activeTab === "portfolio" && (
              <PortfolioContent
                isBalanceHidden={props.isBalanceHidden}
                onBalanceHiddenChange={props.onBalanceHiddenChange}
                onNavigate={setSubView}
              />
            )}
            {props.activeTab === "send" && <SendContent />}
            {props.activeTab === "swap" && <SwapContent />}
          </div>

          {/* Layer 1: List sub-view (allTokens / allActivity) */}
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
              />
            )}
            {(listSubView === "allActivity") && (
              <AllActivityView
                isBalanceHidden={props.isBalanceHidden}
                onBack={() => setSubView(null)}
                onClose={props.onClose}
                onNavigate={setSubView}
              />
            )}
          </div>

          {/* Layer 2: Transaction detail (slides on top of list view) */}
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
