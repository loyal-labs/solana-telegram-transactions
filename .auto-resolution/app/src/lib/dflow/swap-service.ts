import { Keypair, VersionedTransaction } from "@solana/web3.js";

import { getConnection } from "../solana/rpc/connection";
import { SWAP_ERRORS } from "./constants";
import type { SwapResult } from "./types";

export async function executeSwapTransaction(
  serializedTransaction: string,
  userKeypair: Keypair,
  lastValidBlockHeight: number,
  fromAmount: number,
  fromSymbol: string,
  toAmount: number,
  toSymbol: string
): Promise<SwapResult> {
  const connection = getConnection();

  try {
    const transactionBuffer = Buffer.from(serializedTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(transactionBuffer);

    transaction.sign([userKeypair]);

    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        maxRetries: 2,
      }
    );

    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash: transaction.message.recentBlockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    if (confirmation.value.err) {
      console.error("[swap] Transaction error:", confirmation.value.err);
      return {
        success: false,
        error: SWAP_ERRORS.TRANSACTION_FAILED,
      };
    }

    return {
      success: true,
      signature,
      fromAmount,
      fromSymbol,
      toAmount,
      toSymbol,
    };
  } catch (error) {
    console.error("[swap] Execution error:", error);

    if (error instanceof Error) {
      if (error.message.includes("signature")) {
        return { success: false, error: SWAP_ERRORS.SIGNING_FAILED };
      }
      if (error.message.includes("timeout")) {
        return { success: false, error: SWAP_ERRORS.CONFIRMATION_TIMEOUT };
      }
    }

    return {
      success: false,
      error: SWAP_ERRORS.TRANSACTION_FAILED,
    };
  }
}
