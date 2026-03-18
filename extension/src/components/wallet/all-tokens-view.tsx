import { useState } from "react";

import { SearchInput, SubViewHeader } from "~/src/components/wallet/shared";
import { TokenRowItem } from "~/src/components/wallet/token-row-item";
import type { TokenRow } from "@loyal-labs/wallet-core/types";

export function AllTokensView({
  tokens,
  isBalanceHidden,
  onBack,
  onClose,
}: {
  tokens: TokenRow[];
  isBalanceHidden: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = tokens.filter((t) =>
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
            key={token.id ?? `${token.symbol}-${i}`}
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
