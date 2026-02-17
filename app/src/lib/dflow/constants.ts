import {
  SOLANA_USDC_MINT_MAINNET,
  SOLANA_USDT_MINT_MAINNET,
} from "../constants";

export const DFLOW_API_BASE_URL = "https://b.quote-api.dflow.net";

export const COMMON_MINTS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: SOLANA_USDC_MINT_MAINNET,
  USDT: SOLANA_USDT_MINT_MAINNET,
} as const;

export const SWAP_ERRORS = {
  QUOTE_FAILED: "Failed to get swap quote. Please try again.",
  INSUFFICIENT_LIQUIDITY: "Insufficient liquidity for this swap.",
  PRICE_IMPACT_HIGH: "Price impact is too high for this swap.",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  SIGNING_FAILED: "Failed to sign transaction.",
  CONFIRMATION_TIMEOUT: "Transaction confirmation timed out.",
  INVALID_RESPONSE: "Invalid response from swap API.",
  MISSING_API_KEY: "Swap service is not configured.",
} as const;

export const DEFAULT_PRIORITY_FEE_LAMPORTS = 100000;
