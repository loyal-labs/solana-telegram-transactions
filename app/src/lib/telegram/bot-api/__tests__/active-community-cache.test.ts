import { beforeEach, describe, expect, test } from "bun:test";

import {
  evictActiveCommunityCache,
  resolveActiveBotCommunityId,
} from "../active-community-cache";

type CommunityRecord = {
  id: string;
  parserType: "bot" | "userbot";
} | null | undefined;

type CacheDb = Parameters<typeof resolveActiveBotCommunityId>[0];

function createDb(sequence: CommunityRecord[]): CacheDb {
  let index = 0;

  return {
    query: {
      communities: {
        findFirst: async () => sequence[index++] ?? null,
      },
    },
  };
}

describe("active community cache", () => {
  const chatId = BigInt(-1001234567890);

  beforeEach(() => {
    evictActiveCommunityCache(chatId);
  });

  test("returns community id for active bot community", async () => {
    const db = createDb([{ id: "community-1", parserType: "bot" }]);

    const resolved = await resolveActiveBotCommunityId(db, chatId);

    expect(resolved).toBe("community-1");
  });

  test("returns null when no active community exists", async () => {
    const db = createDb([null]);

    const resolved = await resolveActiveBotCommunityId(db, chatId);

    expect(resolved).toBeNull();
  });

  test("returns null when resolved community parser is not bot", async () => {
    const db = createDb([{ id: "community-1", parserType: "userbot" }]);

    const resolved = await resolveActiveBotCommunityId(db, chatId);

    expect(resolved).toBeNull();
  });

  test("evictActiveCommunityCache remains safe no-op for compatibility", () => {
    expect(() => evictActiveCommunityCache(chatId)).not.toThrow();
  });
});
