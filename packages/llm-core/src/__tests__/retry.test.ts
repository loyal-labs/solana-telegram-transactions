import { describe, expect, test } from "bun:test";

import {
  LlmProviderError,
  LlmRetryExhaustedError,
  runWithRetryPolicy,
} from "../index";

describe("runWithRetryPolicy", () => {
  test("returns after a successful retry", async () => {
    let attemptCount = 0;

    const result = await runWithRetryPolicy({
      label: "unit-test",
      policy: { maxAttempts: 3, initialDelayMs: 0, jitterRatio: 0 },
      shouldRetry: () => true,
      task: async () => {
        attemptCount += 1;
        if (attemptCount < 2) {
          throw new LlmProviderError("temporary outage");
        }

        return "ok";
      },
    });

    expect(result.value).toBe("ok");
    expect(result.attempts).toBe(2);
    expect(result.failureReasons).toEqual(["temporary outage"]);
  });

  test("throws retry exhausted after max attempts", async () => {
    await expect(
      runWithRetryPolicy({
        label: "unit-test",
        policy: { maxAttempts: 2, initialDelayMs: 0, jitterRatio: 0 },
        shouldRetry: () => true,
        task: async () => {
          throw new LlmProviderError("still failing");
        },
      })
    ).rejects.toMatchObject({
      attempts: 2,
      failureReasons: ["still failing", "still failing"],
      name: LlmRetryExhaustedError.name,
    });
  });

  test("rethrows original error when shouldRetry is false", async () => {
    await expect(
      runWithRetryPolicy({
        label: "unit-test",
        policy: { maxAttempts: 3, initialDelayMs: 0, jitterRatio: 0 },
        shouldRetry: () => false,
        task: async () => {
          throw new Error("bad input");
        },
      })
    ).rejects.toThrow("bad input");
  });
});
