import { InlineKeyboard } from "grammy";

import type { JupiterTokenMetrics } from "@/lib/jupiter";

export const LOYAL_CA_ADDRESS = "LYLikzBQtpa9ZgVrJsqYGQpR3cC1WMJrBHaXGrQmeta";

function formatUsdValue(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  return `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 3,
  }).format(value)}`;
}

function formatIntegerValue(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function createCaCommandKeyboard(caAddress: string): InlineKeyboard {
  return new InlineKeyboard()
    .url("Jupiter", `https://jup.ag/tokens/${caAddress}`)
    .url("Dexscreener", `https://dexscreener.com/solana/${caAddress}`)
    .row()
    .copyText("Copy CA to clipboard", caAddress);
}

export function formatCaCommandMessage(
  caAddress: string,
  metrics?: JupiterTokenMetrics | null
): string {
  const caAddressMarkdown = `\`${caAddress}\``;
  const tokenInfoLines = [
    `Price: **${formatUsdValue(metrics?.priceUsd)}**`,
    `Market cap: **${formatUsdValue(metrics?.marketCapUsd)}**`,
    `FDV: **${formatUsdValue(metrics?.fdvUsd)}**`,
    `Holders: **${formatIntegerValue(metrics?.holderCount)}**`,
    `Liquidity: **${formatUsdValue(metrics?.liquidityUsd)}**`,
    `Updated: **${metrics?.updatedAt ?? "N/A"}**`,
  ].join("\n");

  return `$LOYAL's CA: ${caAddressMarkdown}\n\n${tokenInfoLines}`;
}
