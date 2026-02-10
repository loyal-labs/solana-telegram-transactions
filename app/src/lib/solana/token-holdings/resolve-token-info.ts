import { DEFAULT_TOKEN_ICON, KNOWN_TOKEN_ICONS } from "./constants";
import type { TokenHolding } from "./types";

const shortenMint = (mint: string): string =>
  mint.length > 10 ? `${mint.slice(0, 4)}...${mint.slice(-4)}` : mint;

export function resolveTokenInfo(
  mint: string,
  holdings: TokenHolding[]
): { symbol: string; icon: string } {
  const holding = holdings.find((h) => h.mint === mint);
  const symbol = holding?.symbol?.trim() ? holding.symbol : shortenMint(mint);
  const icon =
    holding?.imageUrl ||
    KNOWN_TOKEN_ICONS[mint] ||
    DEFAULT_TOKEN_ICON;

  return { symbol, icon };
}
