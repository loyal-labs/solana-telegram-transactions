import { useState } from "react";

import type { TokenRow } from "@loyal-labs/wallet-core/types";

import { SearchInput, SubViewHeader } from "~/src/components/wallet/shared";
import { TokenRowItem } from "~/src/components/wallet/token-row-item";

export function AllTokensView({
  tokens,
  isBalanceHidden,
  onBack,
}: {
  tokens: TokenRow[];
  isBalanceHidden: boolean;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = tokens.filter((t) =>
    t.symbol.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader onBack={onBack} title="Tokens" />
      <SearchInput onChange={setSearch} value={search} />
      <div className="flex-1 overflow-x-hidden overflow-y-auto px-2">
        {filtered.map((token, i) => (
          <TokenRowItem
            isBalanceHidden={isBalanceHidden}
            key={token.id ?? `${token.symbol}-${i}`}
            token={token}
          />
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center font-sans text-sm text-gray-400">
            No tokens found
          </div>
        )}
      </div>
    </div>
  );
}
