# @loyal-labs/llm-server

Server-side Ax runtime helpers built on top of `@loyal-labs/llm-core`.

## What belongs here

- Ax OpenAI-compatible client factory (`createAxOpenAiClient`)
- Program execution wrapper (`runAxProgram`)
- Telemetry sink helpers (`createConsoleTelemetrySink`)

## What does not belong here

- Direct env reads
- App alias imports
- Feature-specific prompt/program specs

## Usage

```ts
import { createAxOpenAiClient, runAxProgram } from "@loyal-labs/llm-server";

const ai = createAxOpenAiClient({
  apiKey: "token",
  apiURL: "https://api.redpill.ai/v1",
  name: "openai",
});

const result = await runAxProgram({
  ai,
  input,
  label: "feature.program",
  model: "deepseek/deepseek-v3.2",
  normalizeOutput: (output) => output,
  program,
  retryPolicy: { maxAttempts: 3 },
});
```

## Add a new Ax-backed feature

1. Define feature program contracts and spec in the owning workspace.
2. Build a service boundary interface for orchestration modules.
3. Use `runAxProgram` for retries + diagnostics.
4. Add eval dataset/baseline before rollout.

## Commands

```bash
bun run --cwd packages/llm-server typecheck
bun run --cwd packages/llm-server build
```
