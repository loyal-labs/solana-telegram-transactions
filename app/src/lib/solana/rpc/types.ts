export type SolanaEnv = "mainnet" | "devnet" | "localnet";

export type WalletTransfer = {
  signature: string;
  slot: number;
  timestamp: number | null;
  direction: "in" | "out";
  type:
    | "transfer"
    | "verify_telegram_init_data"
    | "store"
    | "claim_deposit"
    | "claim_username_deposit"
    | "deposit_for_username"
    | "swap"
    | "secure"
    | "unshield";
  amountLamports: number;
  netChangeLamports: number;
  feeLamports: number;
  status: "success" | "failed";
  counterparty?: string;
};

export type GetAccountTransactionHistoryOptions = {
  limit?: number;
  before?: string;
  onlySystemTransfers?: boolean;
};
