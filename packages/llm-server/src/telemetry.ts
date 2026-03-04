export type LlmTelemetryEvent = {
  attempt?: number;
  errorCauseMessage?: string;
  errorDetails?: Record<string, string>;
  errorMessage?: string;
  errorName?: string;
  errorStack?: string;
  event: "llm_attempt_failed" | "llm_completed";
  latencyMs: number;
  model: string;
  program: string;
};

export type LlmTelemetrySink = (event: LlmTelemetryEvent) => void;

export function createConsoleTelemetrySink(enabled: boolean): LlmTelemetrySink {
  if (!enabled) {
    return () => undefined;
  }

  return (event) => {
    const payload = safeStringify(event);

    if (event.event === "llm_attempt_failed") {
      console.warn("[llm-server]", payload);
      return;
    }

    console.info("[llm-server]", payload);
  };
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({
      event: "llm_telemetry_serialization_failed",
      fallbackValue: String(value),
    });
  }
}
