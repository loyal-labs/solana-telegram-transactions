export type LlmTelemetryEvent = {
  attempt?: number;
  errorMessage?: string;
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
    if (event.event === "llm_attempt_failed") {
      console.warn("[llm-server]", JSON.stringify(event));
      return;
    }

    console.info("[llm-server]", JSON.stringify(event));
  };
}
