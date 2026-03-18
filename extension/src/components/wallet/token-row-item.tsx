import { useState } from "react";

import type { TokenRow } from "@loyal-labs/wallet-core/types";

export function TokenRowItem({
  token,
  isBalanceHidden,
}: {
  token: TokenRow;
  isBalanceHidden: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex w-full items-center overflow-hidden rounded-2xl px-3 transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255, 255, 255, 0.06)" : "transparent",
        cursor: "pointer",
      }}
    >
      <div className="shrink-0 pr-3 py-1.5">
        <div className="relative h-12 w-12">
          <div className="h-12 w-12 overflow-hidden rounded-full">
            <img
              alt={token.symbol}
              className="h-full w-full object-cover"
              height={48}
              src={token.icon}
              width={48}
            />
          </div>
          {token.isSecured && (
            <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs">
              🛡️
            </div>
          )}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-2.5">
        <span className="font-sans text-base font-medium leading-5 tracking-tight text-white">
          {token.symbol}
        </span>
        <span className="font-sans text-[13px] leading-4 text-gray-400">
          {token.price}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 overflow-hidden rounded-md py-2.5 pl-3">
        <span
          className="text-right font-sans text-base leading-5"
          style={{
            color: isBalanceHidden ? "#6b7280" : "#fff",
            filter: isBalanceHidden ? "blur(6px)" : "none",
            transition: "filter 0.15s ease, color 0.15s ease",
            userSelect: isBalanceHidden ? "none" : "auto",
          }}
        >
          {token.amount}
        </span>
        <span
          className="font-sans text-[13px] leading-4"
          style={{
            color: isBalanceHidden ? "#6b7280" : "rgb(156, 163, 175)",
            filter: isBalanceHidden ? "blur(6px)" : "none",
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
