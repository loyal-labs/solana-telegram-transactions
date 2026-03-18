import { useState } from "react";

import { SearchInput, SubViewHeader } from "~/src/components/wallet/shared";
import type { SwapToken } from "@loyal-labs/wallet-core/types";

function SelectableTokenRow({
  token,
  isSelected,
  onClick,
}: {
  token: SwapToken;
  isSelected: boolean;
  onClick: () => void;
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
        background: isSelected ? "rgba(0, 0, 0, 0.04)" : hovered ? "rgba(0, 0, 0, 0.04)" : "transparent",
        transition: "background-color 0.15s ease",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", paddingRight: "12px", paddingTop: "6px", paddingBottom: "6px", flexShrink: 0 }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "9999px", overflow: "hidden" }}>
          <img alt={token.symbol} height={48} src={token.icon} style={{ width: "100%", height: "100%", objectFit: "cover" }} width={48} />
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", padding: "10px 0", minWidth: 0 }}>
        <span style={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: "16px", fontWeight: 500, lineHeight: "20px", color: "#000", letterSpacing: "-0.176px" }}>
          {token.symbol}
        </span>
        <span style={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: "13px", fontWeight: 400, lineHeight: "16px", color: "rgba(60, 60, 67, 0.6)" }}>
          ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end", justifyContent: "center", padding: "10px 0", paddingLeft: "12px", flexShrink: 0 }}>
        <span style={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "20px", color: "#000", textAlign: "right" }}>
          {token.balance.toLocaleString()}
        </span>
        <span style={{ fontFamily: "var(--font-geist-sans), sans-serif", fontSize: "13px", fontWeight: 400, lineHeight: "16px", color: "rgba(60, 60, 67, 0.6)" }}>
          ${(token.balance * token.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

export function TokenSelectView({
  title,
  currentToken,
  onSelect,
  onBack,
  onClose,
  tokens,
}: {
  title: string;
  currentToken: SwapToken;
  onSelect: (token: SwapToken) => void;
  onBack: () => void;
  onClose: () => void;
  tokens: SwapToken[];
}) {
  const [search, setSearch] = useState("");
  const filtered = tokens
    .filter((t) => t.symbol.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SubViewHeader onBack={onBack} onClose={onClose} title={title} />
      <SearchInput onChange={setSearch} value={search} />
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 8px" }}>
        {filtered.map((token, i) => (
          <SelectableTokenRow
            isSelected={token.symbol === currentToken.symbol}
            key={`${token.symbol}-${i}`}
            onClick={() => {
              onSelect(token);
              onBack();
            }}
            token={token}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: "32px 20px", textAlign: "center", fontFamily: "var(--font-geist-sans), sans-serif", fontSize: "14px", color: "rgba(60, 60, 67, 0.6)" }}>
            No tokens found
          </div>
        )}
      </div>
    </div>
  );
}
