import { useState } from "react";

import type { ActivityRow } from "@loyal-labs/wallet-core/types";

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function ActivityRowItem({
  activity,
  isBalanceHidden,
  onClick,
}: {
  activity: ActivityRow | (ActivityRow & { timestamp: string });
  isBalanceHidden: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex w-full items-center overflow-hidden rounded-2xl px-3 transition-colors"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255, 255, 255, 0.06)" : "transparent",
        cursor: "pointer",
      }}
    >
      <div className="shrink-0 pr-3 py-1.5">
        <div className="h-12 w-12 overflow-hidden rounded-full">
          <img
            alt={activity.type}
            className="h-full w-full object-cover"
            height={48}
            src={activity.icon}
            width={48}
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-2.5">
        <span className="font-sans text-base font-medium leading-5 tracking-tight text-white">
          {activity.type === "received"
            ? "Received"
            : activity.type === "shielded"
              ? "Shielded"
              : activity.type === "unshielded"
                ? "Unshielded"
                : "Sent"}
        </span>
        <span className="font-sans text-[13px] leading-4 text-gray-400">
          {activity.type === "shielded"
            ? "to secure balance"
            : activity.type === "unshielded"
              ? "to main balance"
              : activity.type === "received"
                ? `from ${truncateAddress(activity.counterparty)}`
                : `to ${truncateAddress(activity.counterparty)}`}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 overflow-hidden rounded-md py-2.5 pl-3">
        <span
          className="whitespace-nowrap text-right font-sans text-base leading-5"
          style={{
            color: isBalanceHidden
              ? "#6b7280"
              : activity.type === "received"
                ? "#34C759"
                : "#fff",
            filter: isBalanceHidden ? "blur(6px)" : "none",
            transition: "filter 0.15s ease, color 0.15s ease",
            userSelect: isBalanceHidden ? "none" : "auto",
          }}
        >
          {activity.amount}
        </span>
        <span className="whitespace-nowrap font-sans text-[13px] leading-4 text-gray-400">
          {activity.timestamp}
        </span>
      </div>
    </div>
  );
}
