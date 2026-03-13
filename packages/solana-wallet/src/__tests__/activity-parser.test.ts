import { describe, expect, test } from "bun:test";

import {
  nativeSwapFixture,
  programActionFixture,
  secureFixture,
  solTransferFixture,
  swapFixture,
  tokenTransferFixture,
  WALLET_ADDRESS,
} from "../__fixtures__/activity-fixtures";
import { normalizeParsedTransaction } from "../parsers/activity-parser";

describe("normalizeParsedTransaction", () => {
  test("normalizes a sol transfer", () => {
    const activity = normalizeParsedTransaction({
      tx: solTransferFixture(),
      signature: "sol-signature",
      walletAddress: WALLET_ADDRESS,
    });

    expect(activity).toMatchObject({
      type: "sol_transfer",
      signature: "sol-signature",
      direction: "out",
      amountLamports: 500_000_000,
    });
  });

  test("normalizes a token transfer", () => {
    const activity = normalizeParsedTransaction({
      tx: tokenTransferFixture(),
      signature: "token-signature",
      walletAddress: WALLET_ADDRESS,
    });

    expect(activity).toMatchObject({
      type: "token_transfer",
      direction: "out",
      token: {
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: "2",
        decimals: 6,
      },
    });
  });

  test("normalizes a token swap", () => {
    const activity = normalizeParsedTransaction({
      tx: swapFixture(),
      signature: "swap-signature",
      walletAddress: WALLET_ADDRESS,
    });

    expect(activity).toMatchObject({
      type: "swap",
      fromToken: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
      toToken: { mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6nBoP4R2B8vfG8fX" },
    });
  });

  test("normalizes native-to-token swaps", () => {
    const activity = normalizeParsedTransaction({
      tx: nativeSwapFixture(),
      signature: "native-swap-signature",
      walletAddress: WALLET_ADDRESS,
    });

    expect(activity).toMatchObject({
      type: "swap",
      fromToken: { mint: "So11111111111111111111111111111111111111112" },
      toToken: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
    });
  });

  test("normalizes secure and unshield instructions", () => {
    const secure = normalizeParsedTransaction({
      tx: secureFixture(true),
      signature: "secure-signature",
      walletAddress: WALLET_ADDRESS,
    });
    const unshield = normalizeParsedTransaction({
      tx: secureFixture(false),
      signature: "unshield-signature",
      walletAddress: WALLET_ADDRESS,
    });

    expect(secure).toMatchObject({ type: "secure", direction: "out" });
    expect(unshield).toMatchObject({ type: "unshield", direction: "in" });
  });

  test("normalizes program actions", () => {
    const activity = normalizeParsedTransaction({
      tx: programActionFixture(),
      signature: "program-signature",
      walletAddress: WALLET_ADDRESS,
    });

    expect(activity).toMatchObject({
      type: "program_action",
      action: "store",
    });
  });
});
