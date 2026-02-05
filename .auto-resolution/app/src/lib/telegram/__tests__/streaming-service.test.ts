import { describe, expect, test } from "bun:test";

import { splitAtSentenceBoundary } from "../streaming-service";

describe("splitAtSentenceBoundary", () => {
  const DEFAULT_MAX = 4096 - 100; // Same as in streaming-service.ts

  test("returns single-element array for short text", () => {
    const text = "Hello, world!";
    const result = splitAtSentenceBoundary(text);
    expect(result).toEqual([text]);
  });

  test("returns single-element array for text at max length", () => {
    const text = "a".repeat(DEFAULT_MAX);
    const result = splitAtSentenceBoundary(text);
    expect(result).toEqual([text]);
  });

  test("splits at period-space sentence boundary", () => {
    const maxLen = 50;
    const text = "This is the first sentence. This is the second sentence that is longer.";
    const result = splitAtSentenceBoundary(text, maxLen);

    expect(result.length).toBe(2);
    expect(result[0]).toBe("This is the first sentence.");
    expect(result[1]).toBe("This is the second sentence that is longer.");
  });

  test("splits at exclamation-space sentence boundary", () => {
    const maxLen = 20;
    // "Hello there!" is 12 chars, which is > 50% of 20
    const text = "Hello there! How are you?";
    const result = splitAtSentenceBoundary(text, maxLen);

    expect(result.length).toBe(2);
    expect(result[0]).toBe("Hello there!");
    expect(result[1]).toBe("How are you?");
  });

  test("splits at question-space sentence boundary", () => {
    const maxLen = 25;
    const text = "What is going on? I am confused.";
    const result = splitAtSentenceBoundary(text, maxLen);

    expect(result.length).toBe(2);
    expect(result[0]).toBe("What is going on?");
    expect(result[1]).toBe("I am confused.");
  });

  test("splits at period-newline boundary", () => {
    const maxLen = 25;
    // "First sentence." is 15 chars, which is > 50% of 25
    const text = "First sentence.\nSecond sentence here.";
    const result = splitAtSentenceBoundary(text, maxLen);

    expect(result.length).toBe(2);
    expect(result[0]).toBe("First sentence.");
    expect(result[1]).toBe("Second sentence here.");
  });

  test("falls back to word boundary when no sentence boundary found", () => {
    const maxLen = 20;
    // No sentence-ending punctuation, forces word boundary fallback
    const text = "word1 word2 word3 word4 word5 word6";
    const result = splitAtSentenceBoundary(text, maxLen);

    expect(result.length).toBeGreaterThan(1);
    // First chunk should end at a word boundary (no partial words)
    expect(result[0]).toBe("word1 word2 word3");
  });

  test("hard splits as last resort when no good boundary exists", () => {
    const maxLen = 10;
    // Single long word with no spaces
    const text = "abcdefghijklmnopqrstuvwxyz";
    const result = splitAtSentenceBoundary(text, maxLen);

    expect(result.length).toBeGreaterThan(1);
    // First chunk should be exactly maxLen
    expect(result[0].length).toBe(maxLen);
  });

  test("handles empty string", () => {
    const result = splitAtSentenceBoundary("");
    expect(result).toEqual([""]);
  });

  test("preserves content - no data loss after split", () => {
    const maxLen = 50;
    const text =
      "This is a longer text. It has multiple sentences. Each one is important. We must not lose any content.";
    const result = splitAtSentenceBoundary(text, maxLen);

    // Rejoin and compare (allowing for trimmed whitespace)
    const rejoined = result.join(" ");
    // Original words should all be present
    const originalWords = text.split(/\s+/);
    const rejoinedWords = rejoined.split(/\s+/);

    expect(rejoinedWords).toEqual(originalWords);
  });

  test("handles multiple splits correctly", () => {
    const maxLen = 30;
    const text =
      "Sentence one. Sentence two. Sentence three. Sentence four.";
    const result = splitAtSentenceBoundary(text, maxLen);

    expect(result.length).toBeGreaterThanOrEqual(2);
    // Each part should be within limit
    for (const part of result) {
      expect(part.length).toBeLessThanOrEqual(maxLen);
    }
  });

  test("respects custom maxLength parameter", () => {
    const customMax = 100;
    const text = "a".repeat(150);
    const result = splitAtSentenceBoundary(text, customMax);

    expect(result.length).toBe(2);
    expect(result[0].length).toBe(customMax);
    expect(result[1].length).toBe(50);
  });
});
