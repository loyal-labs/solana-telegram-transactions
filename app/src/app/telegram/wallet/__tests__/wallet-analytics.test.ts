import { describe, expect, test } from "bun:test";

import { CLAIM_SOURCES, SEND_METHODS, SWAP_METHODS } from "../wallet-analytics";
import {
  getSendMethod,
  WALLET_ANALYTICS_EVENTS,
  WALLET_ANALYTICS_PATH,
} from "../wallet-analytics";

describe("wallet analytics constants", () => {
  test("uses the wallet path expected by event tracking", () => {
    expect(WALLET_ANALYTICS_PATH).toBe("/telegram/wallet");
  });

  test("keeps wallet event names stable", () => {
    expect(WALLET_ANALYTICS_EVENTS).toEqual({
      openSend: 'Open "Send"',
      sendFunds: "Send Funds",
      sendFundsFailed: "Send Funds Failed",
      openReceive: 'Open "Receive"',
      openSwap: 'Open "Swap"',
      openSecureSwap: 'Open "Secure swap"',
      swapTokens: "Swap tokens",
      swapTokensFailed: "Swap tokens Failed",
      claimFunds: "Claim funds",
      pressWalletBanner: 'Press "Wallet banner"',
      closeWalletBanner: 'Close "Wallet banner"',
    });
  });

  test("keeps wallet method/source constants stable", () => {
    expect(SEND_METHODS).toEqual({
      telegram: "telegram",
      walletAddress: "wallet_address",
      unknown: "unknown",
    });
    expect(SWAP_METHODS).toEqual({
      regular: "regular",
      secure: "secure",
    });
    expect(CLAIM_SOURCES).toEqual({
      manual: "manual",
      auto: "auto",
    });
  });
});

describe("getSendMethod", () => {
  test("returns wallet_address for valid Solana addresses", () => {
    expect(getSendMethod("11111111111111111111111111111111")).toBe(
      SEND_METHODS.walletAddress
    );
  });

  test("returns telegram for valid Telegram usernames", () => {
    expect(getSendMethod("@askloyal")).toBe(SEND_METHODS.telegram);
  });

  test("returns unknown for invalid recipients", () => {
    expect(getSendMethod("not-a-recipient")).toBe(SEND_METHODS.unknown);
  });
});
