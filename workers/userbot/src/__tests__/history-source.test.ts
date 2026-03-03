import { describe, expect, test } from "bun:test";

import {
  fetchMessagesSince,
  fetchUnseenMessages,
  fetchUnseenMessagesByIdBatches,
} from "../lib/sync/history-source";

describe("history source", () => {
  test("first sync returns the latest 200 batch in ascending id order", async () => {
    const client = {
      getHistory: async (_chatId: number, params?: { limit?: number }) => {
        if (params?.limit === 200) {
          return [{ id: 4 }, { id: 2 }, { id: 3 }];
        }
        return [];
      },
      getMessages: async () => [],
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
      getMessages: async () => [],
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

  test("lookback mode stops once history crosses the UTC cutoff", async () => {
    const client = {
      getHistory: async () => [],
      getMessages: async () => [],
      iterHistory: () => {
        const messages = [
          { date: new Date("2026-03-01T12:00:00.000Z"), id: 12 },
          { date: new Date("2026-03-01T00:00:00.000Z"), id: 11 },
          { date: new Date("2026-02-28T23:59:59.999Z"), id: 10 },
          { date: new Date("2026-02-28T12:00:00.000Z"), id: 9 },
        ];

        return (async function* () {
          for (const message of messages) {
            yield message;
          }
        })();
      },
    };

    const seen: number[] = [];
    for await (const message of fetchMessagesSince(
      client,
      1,
      new Date("2026-03-01T00:00:00.000Z")
    )) {
      seen.push((message as { id: number }).id);
    }

    expect(seen).toEqual([12, 11]);
  });

  test("id-batch mode requests 200 ids from last stored+1 and yields ascending non-null messages", async () => {
    const requestedStarts: number[] = [];
    const client = {
      getHistory: async () => [],
      getMessages: async (_chatId: number, messageIds: number[]) => {
        requestedStarts.push(messageIds[0] ?? -1);
        if (messageIds[0] === 11) {
          return [{ id: 13 }, null, { id: 11 }, { id: 12 }];
        }

        return [];
      },
      iterHistory: async function* () {
        yield { id: 999 };
      },
    };

    const seen: number[] = [];
    for await (const message of fetchUnseenMessagesByIdBatches(client, 1, 10)) {
      seen.push((message as { id: number }).id);
    }

    expect(requestedStarts).toEqual([11, 211]);
    expect(seen).toEqual([11, 12, 13]);
  });

  test("id-batch mode stops after first empty batch", async () => {
    let calls = 0;
    const client = {
      getHistory: async () => [],
      getMessages: async () => {
        calls += 1;
        return [];
      },
      iterHistory: async function* () {
        yield { id: 999 };
      },
    };

    const seen: number[] = [];
    for await (const message of fetchUnseenMessagesByIdBatches(client, 1, null)) {
      seen.push((message as { id: number }).id);
    }

    expect(calls).toBe(1);
    expect(seen).toEqual([]);
  });

  test("id-batch mode waits and retries when flood-wait is returned", async () => {
    let calls = 0;
    const sleepCalls: number[] = [];
    const client = {
      getHistory: async () => [],
      getMessages: async () => {
        calls += 1;
        if (calls === 1) {
          throw new Error("A wait of 2 seconds is required");
        }
        return [];
      },
      iterHistory: async function* () {
        yield { id: 999 };
      },
    };

    const seen: number[] = [];
    for await (const message of fetchUnseenMessagesByIdBatches(client, 1, null, {
      sleep: async (ms) => {
        sleepCalls.push(ms);
      },
    })) {
      seen.push((message as { id: number }).id);
    }

    expect(calls).toBe(2);
    expect(sleepCalls).toEqual([3000]);
    expect(seen).toEqual([]);
  });
});
