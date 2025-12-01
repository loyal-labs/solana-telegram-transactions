import { PublicKey, VersionedTransactionResponse } from "@solana/web3.js";

import { getConnection } from "./connection";

export const getAccountTransactionHistory = async (
  publicKey: PublicKey
): Promise<(VersionedTransactionResponse | null)[]> => {
  const connection = getConnection();
  const signatures = await connection.getSignaturesForAddress(publicKey, {
    limit: 10,
  });

  const transactions = await connection.getTransactions(
    signatures.map((s) => s.signature),
    { maxSupportedTransactionVersion: 0 }
  );
  return transactions;
};
