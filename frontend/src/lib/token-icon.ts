const LOGO_DEV_PUBLIC_KEY = "pk_Q3rdnWfqS8SUdYfXkMFweQ";

/**
 * Well-known token symbols supported by logo.dev's crypto endpoint.
 * Exotic / project-specific tokens fall back to a generic icon.
 */
const LOGO_DEV_SYMBOLS = new Set([
  "SOL",
  "USDC",
  "USDT",
  "BNB",
  "WBTC",
  "ETH",
  "BTC",
  "BONK",
  "JUP",
  "RAY",
  "ORCA",
  "PYTH",
  "WIF",
  "JTO",
  "HNT",
  "RENDER",
  "MOBILE",
]);

const GENERIC_TOKEN_ICON = "/hero-new/Wallet-Cover.png";

export function getTokenIconUrl(symbol: string): string {
  if (LOGO_DEV_SYMBOLS.has(symbol.toUpperCase())) {
    return `https://img.logo.dev/crypto/${symbol.toUpperCase()}?token=${LOGO_DEV_PUBLIC_KEY}`;
  }
  return GENERIC_TOKEN_ICON;
}
