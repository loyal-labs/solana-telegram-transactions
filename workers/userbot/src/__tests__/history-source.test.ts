import { describe, expect, test } from "bun:test";

import { fetchUnseenMessages } from "../lib/sync/history-source";

describe("history source", () => {
  test("first sync returns the latest 200 batch in ascending id order", async () => {
    const client = {
      getHistory: async (_chatId: number, params?: { limit?: number }) => {
        if (params?.limit === 200) {
          return [{ id: 4 }, { id: 2 }, { id: 3 }];
        }
        return [];
      },
      iterHistory: async function* () {
        yield { id: 999 };
      },
    };

    const seen: number[] = [];
    for await (const message of fetchUnseenMessages(client, 1, null)) {
      seen.push((message as { id: number }).id);
    }

    expect(seen).toEqual([2, 3, 4]);
  });

  test("incremental sync streams messages without pre-buffering all history", async () => {
    let nextCalls = 0;

    const client = {
      getHistory: async () => [],
      iterHistory: () => ({
        [Symbol.asyncIterator]() {
          return {
            next: async () => {
              nextCalls += 1;
              if (nextCalls === 1) {
                return { done: false, value: { id: 101 } };
              }
              if (nextCalls === 2) {
                return { done: false, value: { id: 102 } };
              }
              return { done: true, value: undefined };
            },
          };
        },
      }),
    };

    const iterator = fetchUnseenMessages(client, 1, 100);
    const first = await iterator.next();
    expect(first.value).toEqual({ id: 101 });
    expect(nextCalls).toBe(1);

    const second = await iterator.next();
    expect(second.value).toEqual({ id: 102 });
    expect(nextCalls).toBe(2);
  });
});
