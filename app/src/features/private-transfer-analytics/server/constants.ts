import { PublicKey } from "@solana/web3.js";

export const PRIVATE_TRANSFER_ANALYTICS_SYNC_KEY =
  "telegram-private-transfer-mainnet";
export const PRIVATE_TRANSFER_PROGRAM_ID = new PublicKey(
  "97FzQdWi26mFNR21AbQNg4KqofiCLqQydQfAvRQMcXhV"
);
export const PRIVATE_TRANSFER_VAULT_ACCOUNT_SPACE = 9;
export const HISTORY_PAGE_LIMIT = 100;
/** How many signatures to send per getParsedTransactions batch. */
export const PARSED_TX_BATCH_SIZE = 10;
export const MAX_HEAD_SYNC_PAGES_PER_RUN = 3;
export const MAX_BACKFILL_PAGES_PER_RUN = 10;
export const HeliusAssetBatchLimit = 100;
/** Max concurrent RPC requests to avoid 429 rate limits. */
export const RPC_CONCURRENCY_LIMIT = 2;
