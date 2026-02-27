import { beforeEach, describe, expect, test } from "bun:test";

import {
  evictActiveCommunityCache,
  resolveActiveBotCommunityId,
} from "../active-community-cache";

type CommunityRecord = {
  id: string;
  parserType: "bot" | "userbot";
} | null;

type CacheDb = Parameters<typeof resolveActiveBotCommunityId>[0];

function createDb(sequence: CommunityRecord[]): CacheDb & { calls: number } {
  let index = 0;

  return {
    get calls() {
      return index;
    },
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

  test("reuses cached bot community after revalidation", async () => {
    const db = createDb([
      { id: "community-1", parserType: "bot" },
      { id: "community-1", parserType: "bot" },
    ]);

    const first = await resolveActiveBotCommunityId(db, chatId);
    const second = await resolveActiveBotCommunityId(db, chatId);

    expect(first).toBe("community-1");
    expect(second).toBe("community-1");
    expect(db.calls).toBe(2);
  });

  test("invalidates cache when parser flips away from bot", async () => {
    const db = createDb([
      { id: "community-1", parserType: "bot" },
      { id: "community-1", parserType: "userbot" },
      { id: "community-1", parserType: "userbot" },
    ]);

    const initial = await resolveActiveBotCommunityId(db, chatId);
    const afterFlip = await resolveActiveBotCommunityId(db, chatId);
    const subsequent = await resolveActiveBotCommunityId(db, chatId);

    expect(initial).toBe("community-1");
    expect(afterFlip).toBeNull();
    expect(subsequent).toBeNull();
    expect(db.calls).toBe(3);
  });
});
