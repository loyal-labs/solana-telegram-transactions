import { describe, expect, test } from "bun:test";

import { generateDraftId } from "../telegram-writer";

describe("generateDraftId", () => {
  test("returns a number", () => {
    const id = generateDraftId();
    expect(typeof id).toBe("number");
  });

  test("returns non-zero value", () => {
    // Run multiple times to increase confidence
    for (let i = 0; i < 100; i++) {
      const id = generateDraftId();
      expect(id).not.toBe(0);
    }
  });

  test("returns positive integer", () => {
    for (let i = 0; i < 100; i++) {
      const id = generateDraftId();
      expect(id).toBeGreaterThan(0);
      expect(Number.isInteger(id)).toBe(true);
    }
  });

  test("returns different values on successive calls", () => {
    const ids = new Set<number>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateDraftId());
    }
    // Should have mostly unique values (allow some collisions due to randomness)
    expect(ids.size).toBeGreaterThan(90);
  });

  test("stays within safe integer range", () => {
    for (let i = 0; i < 100; i++) {
      const id = generateDraftId();
      expect(id).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
      expect(id).toBeLessThanOrEqual(0x7fffffff); // 31-bit max
    }
  });
});
