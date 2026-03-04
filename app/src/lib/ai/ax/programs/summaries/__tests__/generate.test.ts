import { describe, expect, test } from "bun:test";

import { createAxSummaryGenerationService } from "../generate";
import { DEFAULT_SUMMARY_PROGRAM_SPEC } from "../spec";
import type {
  OnelinerGenerationInput,
  OnelinerGenerationOutput,
  TopicExtractionInput,
  TopicExtractionOutput,
} from "../types";

type ProgramOutput = Record<string, unknown>;

function createProgramStub<TInput, TOutput>(outputs: ProgramOutput[]) {
  let callCount = 0;

  return {
    getCallCount: () => callCount,
    program: {
      forward: async (_ai: unknown, _input: TInput) => {
        const selected = outputs[Math.min(callCount, outputs.length - 1)];
        callCount += 1;
        return selected as TOutput;
      },
    },
  };
}

const BASE_REQUEST = {
  chatTitle: "The Loyal Community",
  dayKeyUtc: "2026-03-02",
  participants: ["chris", "Will", "Hexx"],
  transcript:
    "chris: PER settles state to Solana.\\nWill: clarify wallet limits before launch.",
};

const VALID_TOPIC_OUTPUT: TopicExtractionOutput = {
  topics: [
    {
      content:
        "Members reviewed PER settlement behavior and requested clearer UX guidance before launch.",
      sources: ["chris", "Will"],
      title: "PER mechanics and launch UX checks",
    },
  ],
};

describe("createAxSummaryGenerationService", () => {
  test("returns normalized topics and oneliner", async () => {
    const topicStub = createProgramStub<TopicExtractionInput, TopicExtractionOutput>([
      VALID_TOPIC_OUTPUT,
    ]);
    const onelinerStub = createProgramStub<OnelinerGenerationInput, OnelinerGenerationOutput>([
      { oneliner: "  Launch prep centered on PER mechanics and wallet UX limits.  " },
    ]);

    const service = createAxSummaryGenerationService({
      ai: {} as never,
      defaultModel: "z-ai/glm-4.7",
      maxAttempts: 3,
      spec: DEFAULT_SUMMARY_PROGRAM_SPEC,
      testPrograms: {
        onelinerProgram: onelinerStub.program,
        topicProgram: topicStub.program,
      },
    });

    const result = await service.generate(BASE_REQUEST);

    expect(result.topics).toEqual(VALID_TOPIC_OUTPUT.topics);
    expect(result.oneliner).toBe(
      "Launch prep centered on PER mechanics and wallet UX limits."
    );
    expect(result.diagnostics.attempts).toBe(2);
    expect(topicStub.getCallCount()).toBe(1);
    expect(onelinerStub.getCallCount()).toBe(1);
  });

  test("retries malformed topic output and succeeds later", async () => {
    const topicStub = createProgramStub<TopicExtractionInput, TopicExtractionOutput>([
      {
        topics: [
          {
            content: "",
            sources: [],
            title: "",
          },
        ],
      },
      VALID_TOPIC_OUTPUT,
    ]);
    const onelinerStub = createProgramStub<OnelinerGenerationInput, OnelinerGenerationOutput>([
      { oneliner: "Daily thread focused on launch risks and mitigations." },
    ]);

    const service = createAxSummaryGenerationService({
      ai: {} as never,
      defaultModel: "z-ai/glm-4.7",
      maxAttempts: 3,
      spec: DEFAULT_SUMMARY_PROGRAM_SPEC,
      testPrograms: {
        onelinerProgram: onelinerStub.program,
        topicProgram: topicStub.program,
      },
    });

    const result = await service.generate(BASE_REQUEST);

    expect(result.topics).toEqual(VALID_TOPIC_OUTPUT.topics);
    expect(topicStub.getCallCount()).toBe(2);
    expect(onelinerStub.getCallCount()).toBe(1);
  });

  test("retries when topics is not an array and succeeds later", async () => {
    const topicStub = createProgramStub<TopicExtractionInput, TopicExtractionOutput>([
      { topics: { title: "wrong-shape" } },
      VALID_TOPIC_OUTPUT,
    ]);
    const onelinerStub = createProgramStub<OnelinerGenerationInput, OnelinerGenerationOutput>([
      { oneliner: "Daily thread focused on launch risks and mitigations." },
    ]);

    const service = createAxSummaryGenerationService({
      ai: {} as never,
      defaultModel: "z-ai/glm-4.7",
      maxAttempts: 3,
      spec: DEFAULT_SUMMARY_PROGRAM_SPEC,
      testPrograms: {
        onelinerProgram: onelinerStub.program,
        topicProgram: topicStub.program,
      },
    });

    const result = await service.generate(BASE_REQUEST);

    expect(result.topics).toEqual(VALID_TOPIC_OUTPUT.topics);
    expect(topicStub.getCallCount()).toBe(2);
    expect(onelinerStub.getCallCount()).toBe(1);
  });

  test("fails after retry limit when topic output remains invalid", async () => {
    const topicStub = createProgramStub<TopicExtractionInput, TopicExtractionOutput>([
      { topics: [] },
    ]);
    const onelinerStub = createProgramStub<OnelinerGenerationInput, OnelinerGenerationOutput>([
      { oneliner: "unused" },
    ]);

    const service = createAxSummaryGenerationService({
      ai: {} as never,
      defaultModel: "z-ai/glm-4.7",
      maxAttempts: 3,
      spec: DEFAULT_SUMMARY_PROGRAM_SPEC,
      testPrograms: {
        onelinerProgram: onelinerStub.program,
        topicProgram: topicStub.program,
      },
    });

    await expect(service.generate(BASE_REQUEST)).rejects.toThrow(
      "summaries.topic_extraction failed after 3 attempts"
    );
    expect(topicStub.getCallCount()).toBe(3);
    expect(onelinerStub.getCallCount()).toBe(0);
  });

  test("rejects hallucinated sources not in participant list", async () => {
    const topicStub = createProgramStub<TopicExtractionInput, TopicExtractionOutput>([
      {
        topics: [
          {
            content: "The team reviewed priorities.",
            sources: ["NotInChat"],
            title: "Roadmap sync",
          },
        ],
      },
    ]);
    const onelinerStub = createProgramStub<OnelinerGenerationInput, OnelinerGenerationOutput>([
      { oneliner: "unused" },
    ]);

    const service = createAxSummaryGenerationService({
      ai: {} as never,
      defaultModel: "z-ai/glm-4.7",
      maxAttempts: 1,
      spec: DEFAULT_SUMMARY_PROGRAM_SPEC,
      testPrograms: {
        onelinerProgram: onelinerStub.program,
        topicProgram: topicStub.program,
      },
    });

    await expect(service.generate(BASE_REQUEST)).rejects.toThrow(
      "source 'NotInChat' is not in participant list"
    );
  });

  test("retries malformed oneliner and succeeds later", async () => {
    const topicStub = createProgramStub<TopicExtractionInput, TopicExtractionOutput>([
      VALID_TOPIC_OUTPUT,
    ]);
    const onelinerStub = createProgramStub<OnelinerGenerationInput, OnelinerGenerationOutput>([
      { oneliner: "   " },
      { oneliner: "Wallet UX and PER clarity drove the day." },
    ]);

    const service = createAxSummaryGenerationService({
      ai: {} as never,
      defaultModel: "z-ai/glm-4.7",
      maxAttempts: 3,
      spec: DEFAULT_SUMMARY_PROGRAM_SPEC,
      testPrograms: {
        onelinerProgram: onelinerStub.program,
        topicProgram: topicStub.program,
      },
    });

    const result = await service.generate(BASE_REQUEST);

    expect(result.oneliner).toBe("Wallet UX and PER clarity drove the day.");
    expect(topicStub.getCallCount()).toBe(1);
    expect(onelinerStub.getCallCount()).toBe(2);
  });
});
