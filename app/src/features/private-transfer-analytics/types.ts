export type PrivateTransferAnalyticsFlow = "shield" | "unshield";

export type PrivateTransferModifyBalanceEventInput = {
  amountRaw: string;
  flow: PrivateTransferAnalyticsFlow;
  instructionIndex: number;
  occurredAt: Date;
  signature: string;
  slot: bigint;
  tokenMint: string;
  userAddress: string;
  vaultAddress: string;
};

export type PrivateTransferModifyBalanceEventRecord =
  PrivateTransferModifyBalanceEventInput;

export type PrivateTransferVaultHoldingRow = {
  amountRaw: string;
  snapshotAt: Date;
  tokenAccountAddress: string;
  tokenMint: string;
  vaultAddress: string;
};

export type PrivateTransferTokenCatalogUpsert = {
  decimals: number;
  name: string;
  priceUsd: string | null;
  symbol: string;
  tokenMint: string;
};

export type PrivateTransferHistorySyncStats = {
  backfillCompleted: boolean;
  backfillPagesProcessed: number;
  eventsInserted: number;
  eventsSkippedMissingBlockTime: number;
  headPagesProcessed: number;
  latestSeenSignature: string | null;
  signaturesFetched: number;
};

export type PrivateTransferVaultSnapshotStats = {
  holdingsUpserted: number;
  tokenCatalogUpdated: number;
  vaultsDiscovered: number;
};

export type PrivateTransferAnalyticsCronStats = {
  history: PrivateTransferHistorySyncStats;
  vaults: PrivateTransferVaultSnapshotStats;
};
