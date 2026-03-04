# @loyal-labs/llm-core

Runtime-agnostic primitives for LLM flows.

## What belongs here

- Shared error taxonomy (`LlmValidationError`, `LlmAssertionError`, `LlmProviderError`, `LlmRetryExhaustedError`)
- Retry engine (`runWithRetryPolicy`)
- Validation helpers (`assertValidationResult`, `validationSuccess`, `validationFailure`)
- Cross-workspace types (`RetryPolicy`, `LlmProviderConfig`, `LlmRunMeta`)

## What does not belong here

- App alias imports (forbidden in shared packages)
- Env reads (`process.env`)
- Provider-specific client initialization

## Usage

```ts
import {
  LlmProviderError,
  runWithRetryPolicy,
  type RetryPolicy,
} from "@loyal-labs/llm-core";

const policy: RetryPolicy = { maxAttempts: 3 };

const result = await runWithRetryPolicy({
  label: "example.program",
  policy,
  shouldRetry: (error) => !(error instanceof TypeError),
  task: async () => {
    throw new LlmProviderError("transient", { retryable: true });
  },
});
```

## Commands

```bash
bun run --cwd packages/llm-core typecheck
bun run --cwd packages/llm-core build
bun run --cwd packages/llm-core test
```
