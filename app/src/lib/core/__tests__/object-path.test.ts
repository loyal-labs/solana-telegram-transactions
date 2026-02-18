import { describe, expect, test } from "bun:test";

import {
  encodeObjectPath,
  joinObjectPaths,
  normalizeObjectPath,
} from "../object-path";

describe("object-path", () => {
  test("normalizes object paths and removes duplicate slashes", () => {
    expect(normalizeObjectPath(" /avatars//group-1/ ", "key")).toBe(
      "avatars/group-1"
    );
  });

  test("rejects empty values", () => {
    expect(() => normalizeObjectPath("  ///  ", "key")).toThrow(
      "key is required"
    );
  });

  test("rejects unsafe dot segments", () => {
    expect(() => normalizeObjectPath("a/./b", "key")).toThrow(
      "key contains an invalid path segment"
    );
    expect(() => normalizeObjectPath("a/../b", "key")).toThrow(
      "key contains an invalid path segment"
    );
  });

  test("joins prefix and key without producing double slashes", () => {
    expect(joinObjectPaths("telegram/photos/", "/group-1//avatar.png", "key")).toBe(
      "telegram/photos/group-1/avatar.png"
    );
  });

  test("encodes each path segment while preserving segment separators", () => {
    expect(encodeObjectPath("team photos/emoji #1.png")).toBe(
      "team%20photos/emoji%20%231.png"
    );
  });
});
