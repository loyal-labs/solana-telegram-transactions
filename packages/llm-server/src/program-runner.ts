import type { AxAIService, AxAssertion } from "@ax-llm/ax";
import {
  getErrorMessage,
  isRetryableLlmError,
  LlmAssertionError,
  LlmProviderError,
  LlmValidationError,
  runWithRetryPolicy,
  type LlmRunMeta,
  type RetryPolicy,
} from "@loyal-labs/llm-core";

import type { LlmTelemetrySink } from "./telemetry";

export type AxProgramLike<TInput, TOutput> = {
  forward: (
    ai: AxAIService,
    input: TInput,
    options?: {
      asserts?: AxAssertion[];
      model?: string;
    }
  ) => Promise<TOutput>;
};

export type RunAxProgramParams<TInput, TOutput, TResult> = {
  ai: AxAIService;
  asserts?: AxAssertion[];
  input: TInput;
  label: string;
  model: string;
  normalizeOutput: (output: TOutput) => TResult;
  program: AxProgramLike<TInput, TOutput>;
  retryPolicy: RetryPolicy;
  telemetry?: LlmTelemetrySink;
};

export type RunAxProgramResult<TResult> = {
  diagnostics: LlmRunMeta;
  value: TResult;
};

export async function runAxProgram<TInput, TOutput, TResult>(
  params: RunAxProgramParams<TInput, TOutput, TResult>
): Promise<RunAxProgramResult<TResult>> {
  const startTimeMs = Date.now();

  const runResult = await runWithRetryPolicy({
    label: params.label,
    onAttemptFailure: (failure) => {
      params.telemetry?.({
        attempt: failure.attempt,
        errorMessage: failure.reason,
        event: "llm_attempt_failed",
        latencyMs: Date.now() - startTimeMs,
        model: params.model,
        program: params.label,
      });
    },
    policy: params.retryPolicy,
    shouldRetry: (error) => {
      if (error instanceof LlmValidationError) {
        return true;
      }

      return isRetryableLlmError(error);
    },
    task: async () => {
      let output: TOutput;
      try {
        output = await params.program.forward(params.ai, params.input, {
          asserts: params.asserts,
          model: params.model,
        });
      } catch (error) {
        if (
          error instanceof LlmValidationError ||
          error instanceof LlmAssertionError ||
          error instanceof LlmProviderError
        ) {
          throw error;
        }

        throw new LlmProviderError(getErrorMessage(error), {
          details: {
            program: params.label,
          },
          retryable: true,
        });
      }

      try {
        return params.normalizeOutput(output);
      } catch (error) {
        if (error instanceof LlmValidationError || error instanceof LlmAssertionError) {
          throw error;
        }

        throw new LlmValidationError(getErrorMessage(error), {
          program: params.label,
        });
      }
    },
  });

  const diagnostics: LlmRunMeta = {
    attempts: runResult.attempts,
    failureReasons: runResult.failureReasons,
    finalModel: params.model,
    latencyMs: Date.now() - startTimeMs,
  };

  params.telemetry?.({
    event: "llm_completed",
    latencyMs: diagnostics.latencyMs,
    model: params.model,
    program: params.label,
  });

  return {
    diagnostics,
    value: runResult.value,
  };
}
