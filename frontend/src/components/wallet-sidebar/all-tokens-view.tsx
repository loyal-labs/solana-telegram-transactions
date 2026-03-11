"use client";

import { useState } from "react";

import { SearchInput, SubViewHeader } from "./shared";
import { TokenRowItem } from "./token-row-item";
import { allTokens } from "./types";

export function AllTokensView({
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
