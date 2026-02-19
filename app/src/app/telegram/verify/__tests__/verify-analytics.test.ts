import { describe, expect, test } from "bun:test";

import {
  VERIFY_ANALYTICS_EVENTS,
  VERIFY_ANALYTICS_PATH,
  VERIFY_BIOMETRICS_OUTCOMES,
} from "../verify-analytics";

describe("verify analytics constants", () => {
  test("uses the verify path expected by event tracking", () => {
    expect(VERIFY_ANALYTICS_PATH).toBe("/telegram/verify");
  });

  test("keeps verify event names stable", () => {
    expect(VERIFY_ANALYTICS_EVENTS).toEqual({
      openEnableBiometrics: 'Open "Enable Biometrics"',
      openVerify: 'Open "Verify"',
      verifyBiometrics: "Verify Biometrics",
      verifyBiometricsFailed: "Verify Biometrics Failed",
    });
  });

  test("keeps biometrics outcomes stable", () => {
    expect(VERIFY_BIOMETRICS_OUTCOMES).toEqual({
      authorized: "authorized",
      denied: "denied",
      error: "error",
      not_available: "not_available",
    });
  });
});
