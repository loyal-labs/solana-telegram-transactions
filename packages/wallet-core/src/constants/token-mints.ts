export const TOKEN_MINTS: Record<string, string> = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  LOYAL: "LYLikzBQtpa9ZgVrJsqYGQpR3cC1WMJrBHaXGrQmeta",
};

export const TOKEN_DECIMALS: Record<string, number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
  BONK: 5,
  LOYAL: 6,
};

export function getTokenMint(symbol: string): string {
  const mint = TOKEN_MINTS[symbol];
  if (!mint) throw new Error(`Unknown token symbol: ${symbol}`);
  return mint;
}

export function getTokenDecimals(symbol: string): number {
  const decimals = TOKEN_DECIMALS[symbol];
  if (decimals === undefined)
    throw new Error(`Unknown token symbol: ${symbol}`);
  return decimals;
}
