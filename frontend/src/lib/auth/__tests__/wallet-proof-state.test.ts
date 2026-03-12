import { describe, expect, test } from "bun:test";

import {
  initialWalletProofState,
  walletProofReducer,
} from "@/lib/auth/wallet-proof-state";

describe("wallet proof state", () => {
  test("moves into an error state with details", () => {
    const nextState = walletProofReducer(initialWalletProofState, {
      type: "failed",
      status: "error",
      message: "Wallet verification failed.",
      details: ["Try again."],
    });

    expect(nextState).toEqual({
      status: "error",
      errorMessage: "Wallet verification failed.",
      errorDetails: ["Try again."],
    });
  });

  test("resets back to idle", () => {
    const failedState = walletProofReducer(initialWalletProofState, {
      type: "failed",
      status: "unsupported",
      message: "This wallet does not support message signing.",
    });

    expect(walletProofReducer(failedState, { type: "reset" })).toEqual(
      initialWalletProofState
    );
  });
});
