import { describe, expect, test } from "bun:test";
import { LlmProviderError, LlmValidationError } from "@loyal-labs/llm-core";

import { runAxProgram } from "../program-runner";

describe("runAxProgram", () => {
  test("retries on validation errors and succeeds", async () => {
    let callCount = 0;

    const result = await runAxProgram({
      ai: {} as never,
      input: { foo: "bar" },
      label: "test.program",
      model: "test-model",
      normalizeOutput: (output: { value: string }) => {
        if (!output.value) {
          throw new LlmValidationError("value required");
        }

        return output.value;
      },
      program: {
        forward: async () => {
          callCount += 1;
          if (callCount === 1) {
            return { value: "" };
          }

          return { value: "ok" };
        },
      },
      retryPolicy: {
        initialDelayMs: 0,
        jitterRatio: 0,
        maxAttempts: 3,
      },
    });

    expect(result.value).toBe("ok");
    expect(result.diagnostics.attempts).toBe(2);
    expect(result.diagnostics.failureReasons).toEqual(["value required"]);
  });

  test("does not retry non-retryable provider errors", async () => {
    let callCount = 0;

    await expect(
      runAxProgram({
        ai: {} as never,
        input: { foo: "bar" },
        label: "test.program",
        model: "test-model",
        normalizeOutput: (output: { value: string }) => output.value,
        program: {
          forward: async () => {
            callCount += 1;
            throw new LlmProviderError("hard failure", { retryable: false });
          },
        },
        retryPolicy: {
          initialDelayMs: 0,
          jitterRatio: 0,
          maxAttempts: 3,
        },
      })
    ).rejects.toBeInstanceOf(LlmProviderError);

    expect(callCount).toBe(1);
  });
});
