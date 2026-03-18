import { useState } from "react";

import type { SwapToken } from "@loyal-labs/wallet-core/types";

import { SearchInput, SubViewHeader } from "~/src/components/wallet/shared";

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
      className="flex w-full cursor-pointer items-center overflow-hidden rounded-2xl px-3 transition-colors"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected
          ? "rgba(255, 255, 255, 0.08)"
          : hovered
            ? "rgba(255, 255, 255, 0.06)"
            : "transparent",
      }}
    >
      <div className="shrink-0 pr-3 py-1.5">
        <div className="h-12 w-12 overflow-hidden rounded-full">
          <img
            alt={token.symbol}
            className="h-full w-full object-cover"
            height={48}
            src={token.icon}
            width={48}
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-2.5">
        <span className="font-sans text-base font-medium leading-5 tracking-tight text-white">
          {token.symbol}
        </span>
        <span className="font-sans text-[13px] leading-4 text-gray-400">
          $
          {token.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 py-2.5 pl-3">
        <span className="text-right font-sans text-base leading-5 text-white">
          {token.balance.toLocaleString()}
        </span>
        <span className="font-sans text-[13px] leading-4 text-gray-400">
          $
          {(token.balance * token.price).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
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
  tokens,
}: {
  title: string;
  currentToken: SwapToken;
  onSelect: (token: SwapToken) => void;
  onBack: () => void;
  tokens: SwapToken[];
}) {
  const [search, setSearch] = useState("");
  const filtered = tokens.filter((t) =>
    t.symbol.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader onBack={onBack} title={title} />
      <SearchInput onChange={setSearch} value={search} />
      <div className="flex-1 overflow-x-hidden overflow-y-auto px-2">
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
          <div className="py-8 text-center font-sans text-sm text-gray-400">
            No tokens found
          </div>
        )}
      </div>
    </div>
  );
}
