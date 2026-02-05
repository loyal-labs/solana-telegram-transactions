export const CACHE_TTL_MS = 30_000;

export const NATIVE_SOL_MINT = "So11111111111111111111111111111111111111112";
export const NATIVE_SOL_DECIMALS = 9;

// Known token icons (fallback when Helius has no image)
export const KNOWN_TOKEN_ICONS: Record<string, string> = {
  "So11111111111111111111111111111111111111112": "/solana-sol-logo.png",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "/USDT.png",
};

export const DEFAULT_TOKEN_ICON = "/icons/token-default.svg";
