export type WalletTransfer = {
  signature: string;
  slot: number;
  timestamp: number | null;
  direction: "in" | "out";
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
