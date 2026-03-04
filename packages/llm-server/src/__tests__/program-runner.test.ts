import { describe, expect, test } from "bun:test";
import {
  LlmProviderError,
  LlmRetryExhaustedError,
  LlmValidationError,
} from "@loyal-labs/llm-core";

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

  test("preserves wrapped error cause/details and emits telemetry diagnostics", async () => {
    const telemetryEvents: Array<Record<string, unknown>> = [];
    const underlyingError = new Error("Generate failed", {
      cause: new Error("Unable to fix validation error: topics must be an array"),
    }) as Error & {
      details?: Record<string, unknown>;
    };
    underlyingError.name = "AxGenerateError";
    underlyingError.details = {
      model: "z-ai/glm-4.7",
      streaming: true,
    };

    let thrown: unknown;

    await runAxProgram({
      ai: {} as never,
      input: { foo: "bar" },
      label: "test.program",
      model: "test-model",
      normalizeOutput: (output: { value: string }) => output.value,
      program: {
        forward: async () => {
          throw underlyingError;
        },
      },
      retryPolicy: {
        initialDelayMs: 0,
        jitterRatio: 0,
        maxAttempts: 1,
      },
      telemetry: (event) => telemetryEvents.push(event as unknown as Record<string, unknown>),
    }).catch((error) => {
      thrown = error;
    });

    expect(thrown).toBeInstanceOf(LlmRetryExhaustedError);
    expect((thrown as Error).message).toContain("Generate failed");
    expect((thrown as LlmRetryExhaustedError).failureReasons).toEqual([
      "Generate failed",
    ]);

    expect(telemetryEvents.length).toBe(1);
    expect(telemetryEvents[0]).toMatchObject({
      attempt: 1,
      errorCauseMessage: "Generate failed",
      errorMessage: "Generate failed",
      errorName: LlmProviderError.name,
      event: "llm_attempt_failed",
      model: "test-model",
      program: "test.program",
    });

    const llmErrorDetails = (
      telemetryEvents[0].errorDetails as { llmErrorDetails?: string } | undefined
    )?.llmErrorDetails;
    expect(llmErrorDetails).toContain('"program":"test.program"');
    expect(llmErrorDetails).toContain(
      '"cause":"Unable to fix validation error: topics must be an array"'
    );
    const parsedLlmErrorDetails = JSON.parse(llmErrorDetails ?? "{}") as {
      errorDetails?: { details?: string };
    };
    expect(parsedLlmErrorDetails.errorDetails?.details).toContain(
      '"model":"z-ai/glm-4.7"'
    );
  });
});
