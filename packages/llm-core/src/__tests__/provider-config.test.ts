import { describe, expect, test } from "bun:test";

import { LlmValidationError } from "../errors";
import { resolveLlmProviderConfig } from "../provider-config";

describe("resolveLlmProviderConfig", () => {
  test("returns normalized config using overrides", () => {
    const result = resolveLlmProviderConfig({
      defaults: {
        apiKey: "default-key",
        model: "default-model",
      },
      overrides: {
        apiKey: "  override-key  ",
        model: "  override-model  ",
      },
      provider: {
        apiURL: " https://api.example.com/v1 ",
        headers: {
          "X-Test": "1",
        },
        name: "openai",
      },
    });

    expect(result).toEqual({
      config: {
        apiKey: "override-key",
        apiURL: "https://api.example.com/v1",
        headers: {
          "X-Test": "1",
        },
        name: "openai",
      },
      model: "override-model",
    });
  });

  test("falls back to default model and provider api key", () => {
    const result = resolveLlmProviderConfig({
      defaults: {
        apiKey: "default-key",
        model: "default-model",
      },
      provider: {
        apiKey: "provider-key",
        apiURL: "https://api.example.com/v1",
      },
    });

    expect(result.config.apiKey).toBe("provider-key");
    expect(result.model).toBe("default-model");
  });

  test("throws LlmValidationError when no api key is resolvable", () => {
    expect(() =>
      resolveLlmProviderConfig({
        defaults: {
          apiKey: "   ",
          model: "default-model",
        },
        overrides: {
          apiKey: "",
        },
        provider: {
          apiURL: "https://api.example.com/v1",
        },
      })
    ).toThrow(LlmValidationError);

    expect(() =>
      resolveLlmProviderConfig({
        defaults: {
          apiKey: "   ",
          model: "default-model",
        },
        provider: {
          apiURL: "https://api.example.com/v1",
        },
      })
    ).toThrow("LLM provider apiKey is required");
  });

  test("throws LlmValidationError when default model is empty", () => {
    expect(() =>
      resolveLlmProviderConfig({
        defaults: {
          apiKey: "default-key",
          model: "   ",
        },
        provider: {
          apiURL: "https://api.example.com/v1",
        },
      })
    ).toThrow(LlmValidationError);
  });

  test("throws LlmValidationError when provider apiURL is empty", () => {
    expect(() =>
      resolveLlmProviderConfig({
        defaults: {
          apiKey: "default-key",
          model: "default-model",
        },
        provider: {
          apiURL: "",
        },
      })
    ).toThrow("LLM provider apiURL is required");
  });
});
