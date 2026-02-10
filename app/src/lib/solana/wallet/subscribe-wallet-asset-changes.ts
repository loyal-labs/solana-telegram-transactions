import { type GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";

import { getWebsocketConnection } from "../rpc/connection";

// SPL Token programs
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export type SubscribeWalletAssetChangesOptions = {
  commitment?: "processed" | "confirmed" | "finalized";
  debounceMs?: number;
  /**
   * Subscribe to the wallet's native SOL account changes.
   * If the caller already subscribes to balance elsewhere, disable to avoid duplicate websocket listeners.
   */
  includeNative?: boolean;
};

/**
 * Subscribes to changes that can impact a wallet's portfolio:
 * - Native SOL (wallet system account, optional)
 * - SPL token accounts owned by the wallet (Token + Token-2022)
 *
 * Emits debounced `onChange()` calls to avoid refetch storms.
 */
export async function subscribeToWalletAssetChanges(
  walletAddress: string,
  onChange: () => void,
  options: SubscribeWalletAssetChangesOptions = {}
): Promise<() => Promise<void>> {
  const walletPubkey = new PublicKey(walletAddress);
  const connection = getWebsocketConnection();

  const commitment = options.commitment ?? "confirmed";
  const debounceMs = options.debounceMs ?? 750;
  const includeNative = options.includeNative ?? true;

  let closed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending = false;

  const emit = () => {
    if (closed) return;

    if (debounceMs <= 0) {
      try {
        onChange();
      } catch (err) {
        console.error("Error in wallet asset change handler", err);
      }
      return;
    }

    if (timer) clearTimeout(timer);
    pending = true;
    timer = setTimeout(() => {
      timer = null;
      if (closed) return;
      if (!pending) return;
      pending = false;
      try {
        onChange();
      } catch (err) {
        console.error("Error in wallet asset change handler", err);
      }
    }, debounceMs);
  };

  const ownerMemcmpFilter: GetProgramAccountsFilter = {
    memcmp: {
      // owner field offset in SPL Token account layout (both Token + Token-2022)
      offset: 32,
      bytes: walletPubkey.toBase58(),
    },
  };

  // Classic SPL token accounts are fixed-size (165 bytes).
  const tokenProgramFilters: GetProgramAccountsFilter[] = [
    { dataSize: 165 },
    ownerMemcmpFilter,
  ];

  // Token-2022 accounts can include extensions, so sizes vary. Filter only by owner.
  const token2022ProgramFilters: GetProgramAccountsFilter[] = [
    ownerMemcmpFilter,
  ];

  const accountSubId = includeNative
    ? await connection.onAccountChange(walletPubkey, emit, commitment)
    : null;

  // SPL Token (Tokenkeg) accounts owned by wallet
  const tokenSubId = await connection.onProgramAccountChange(
    TOKEN_PROGRAM_ID,
    emit,
    commitment,
    tokenProgramFilters
  );

  // SPL Token-2022 accounts owned by wallet
  const token2022SubId = await connection.onProgramAccountChange(
    TOKEN_2022_PROGRAM_ID,
    emit,
    commitment,
    token2022ProgramFilters
  );

  return async () => {
    closed = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    await Promise.allSettled([
      ...(accountSubId !== null
        ? [connection.removeAccountChangeListener(accountSubId)]
        : []),
      connection.removeProgramAccountChangeListener(tokenSubId),
      connection.removeProgramAccountChangeListener(token2022SubId),
    ]);
  };
}
