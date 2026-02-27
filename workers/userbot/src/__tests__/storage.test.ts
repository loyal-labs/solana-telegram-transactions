import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import {
  ensureStorageReady,
  resolveSessionSqlitePath,
  resolveStorageDir,
} from "../lib/storage";

describe("storage primitives", () => {
  test("ensureStorageReady is idempotent", async () => {
    const dir = await mkdtemp(join(tmpdir(), "userbot-storage-"));

    try {
      const first = await ensureStorageReady(dir);
      const second = await ensureStorageReady(dir);

      expect(first).toBe(second);
      expect(resolveStorageDir(dir)).toBe(first);
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });

  test("resolveSessionSqlitePath is account-scoped and stable", async () => {
    const dir = await mkdtemp(join(tmpdir(), "userbot-storage-"));

    try {
      const primary = resolveSessionSqlitePath("primary", dir);
      const secondary = resolveSessionSqlitePath("secondary", dir);

      expect(primary.endsWith("mtcute-primary.sqlite")).toBe(true);
      expect(secondary.endsWith("mtcute-secondary.sqlite")).toBe(true);
      expect(primary === secondary).toBe(false);
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });
});
