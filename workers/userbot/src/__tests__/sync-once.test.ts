import { describe, expect, test } from "bun:test";

import { runSyncOnce, runSyncOnceCli } from "../commands/sync-once";
import type { UserbotConfig } from "../lib/env";

type FakeLogger = {
  error: (..._args: unknown[]) => void;
  info: (..._args: unknown[]) => void;
  warn: (..._args: unknown[]) => void;
};

type CommunityRecord = {
  chatId: bigint;
  chatTitle: string;
  id: string;
  parserType: "bot" | "userbot";
};

type MessageRecord = {
  date: Date;
  id: number;
  isService: boolean;
  media: { type: string } | null;
  sender?: {
    displayName?: string | null;
    id: number;
    type: string;
    username?: string | null;
  } | null;
  text: string;
};

type FakeState = {
  communities: CommunityRecord[];
  existingMembershipKeys: Set<string>;
  existingMessageKeys: Set<string>;
  getHistoryCalls: Array<{ chatId: number; limit: number }>;
  getHistoryLimitOneFailCount: number;
  incrementalHistory: unknown[];
  initialHistory: unknown[];
  insertedMembershipRows: number;
  insertedMessageRows: number;
  insertedUserRows: number;
  iterHistoryCalls: Array<{ chatId: number; minId: number }>;
  latestStoredMessageId: bigint | null;
  latestTelegramMessageId: number | null;
  usersByTelegramId: Map<string, { displayName: string; id: string; username: string | null }>;
};

function createLogger(): FakeLogger {
  return {
    error: () => undefined,
    info: () => undefined,
    warn: () => undefined,
  };
}

function createConfig(): UserbotConfig {
  return {
    accountKey: "primary",
    apiHash: "hash",
    apiId: 123,
    storageDir: "/tmp/userbot",
  };
}

function createFakeState(
  overrides: Partial<
    Omit<
      FakeState,
      | "existingMembershipKeys"
      | "existingMessageKeys"
      | "getHistoryCalls"
      | "insertedMembershipRows"
      | "insertedMessageRows"
      | "insertedUserRows"
      | "iterHistoryCalls"
      | "usersByTelegramId"
    >
  > = {}
): FakeState {
  return {
    communities: overrides.communities ?? [],
    existingMembershipKeys: new Set<string>(),
    existingMessageKeys: new Set<string>(),
    getHistoryCalls: [],
    getHistoryLimitOneFailCount: overrides.getHistoryLimitOneFailCount ?? 0,
    incrementalHistory: overrides.incrementalHistory ?? [],
    initialHistory: overrides.initialHistory ?? [],
    insertedMembershipRows: 0,
    insertedMessageRows: 0,
    insertedUserRows: 0,
    iterHistoryCalls: [],
    latestStoredMessageId:
      overrides.latestStoredMessageId === undefined
        ? null
        : overrides.latestStoredMessageId,
    latestTelegramMessageId:
      overrides.latestTelegramMessageId === undefined
        ? null
        : overrides.latestTelegramMessageId,
    usersByTelegramId: new Map<string, { displayName: string; id: string; username: string | null }>(),
  };
}

function createFakeDb(state: FakeState): any {
  return {
    query: {
      communities: {
        findMany: async () =>
          state.communities.filter((community) => community.parserType === "userbot"),
      },
      messages: {
        findFirst: async () =>
          state.latestStoredMessageId === null
            ? null
            : { telegramMessageId: state.latestStoredMessageId },
      },
      users: {
        findFirst: async () => {
          const first = state.usersByTelegramId.values().next();
          if (first.done) {
            return null;
          }

          return first.value;
        },
      },
    },
    insert: () => ({
      values: (values: Record<string, unknown>) => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if ("telegramId" in values) {
              const telegramId = String(values.telegramId);
              const existing = state.usersByTelegramId.get(telegramId);
              if (existing) {
                return [];
              }

              const newUser = {
                displayName: String(values.displayName),
                id: `user-${state.usersByTelegramId.size + 1}`,
                username:
                  values.username === null ? null : (values.username as string | null),
              };
              state.usersByTelegramId.set(telegramId, newUser);
              state.insertedUserRows += 1;
              return [{ id: newUser.id }];
            }

            if (
              "communityId" in values &&
              "userId" in values &&
              !("content" in values)
            ) {
              const key = `${values.communityId}:${values.userId}`;
              if (state.existingMembershipKeys.has(key)) {
                return [];
              }

              state.existingMembershipKeys.add(key);
              state.insertedMembershipRows += 1;
              return [{ id: `community-member-${state.insertedMembershipRows}` }];
            }

            if ("content" in values && "telegramMessageId" in values) {
              const key = `${values.communityId}:${String(values.telegramMessageId)}`;
              if (state.existingMessageKeys.has(key)) {
                return [];
              }

              state.existingMessageKeys.add(key);
              state.insertedMessageRows += 1;
              return [{ id: `message-${state.insertedMessageRows}` }];
            }

            return [];
          },
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: async () => undefined,
      }),
    }),
  };
}

function createFakeBundle(state: FakeState): any {
  return {
    client: {
      destroy: async () => undefined,
      getHistory: async (chatId: number, params?: { limit?: number }) => {
        const limit = params?.limit ?? 0;
        state.getHistoryCalls.push({ chatId, limit });

        if (limit === 1) {
          if (state.getHistoryLimitOneFailCount > 0) {
            state.getHistoryLimitOneFailCount -= 1;
            throw new Error("timeout");
          }

          if (state.latestTelegramMessageId === null) {
            return [];
          }

          return [
            {
              id: state.latestTelegramMessageId,
            },
          ];
        }

        if (limit === 200) {
          return state.initialHistory;
        }

        return [];
      },
      iterHistory: (_chatId: number, params?: { minId?: number }) => {
        state.iterHistoryCalls.push({
          chatId: _chatId,
          minId: params?.minId ?? 0,
        });

        const messages = state.incrementalHistory;
        return (async function* () {
          for (const message of messages) {
            yield message;
          }
        })();
      },
      start: async () => ({ id: 1 }),
    },
    config: createConfig(),
    sessionPath: "/tmp/userbot/mtcute-primary.sqlite",
  };
}

describe("sync:once command", () => {
  test("fails fast when session file is missing", async () => {
    let createClientCalls = 0;
    const statusCode = await runSyncOnceCli({
      createClient: async () => {
        createClientCalls += 1;
        return createFakeBundle(createFakeState());
      },
      createDb: () => createFakeDb(createFakeState()),
      hasFile: async () => false,
      loadConfig: () => createConfig(),
      loadDatabaseUrl: () => "postgres://db",
      logger: createLogger(),
      sleep: async () => undefined,
    });

    expect(statusCode).toBe(1);
    expect(createClientCalls).toBe(0);
  });

  test("returns zero-work stats when no userbot communities exist", async () => {
    const state = createFakeState();

    const result = await runSyncOnce({
      createClient: async () => createFakeBundle(state),
      createDb: () => createFakeDb(state),
      hasFile: async () => true,
      loadConfig: () => createConfig(),
      loadDatabaseUrl: () => "postgres://db",
      logger: createLogger(),
      sleep: async () => undefined,
    });

    expect(result.stats.communitiesScanned).toBe(0);
    expect(result.stats.communitiesProcessed).toBe(0);
    expect(result.stats.insertedMessages).toBe(0);
    expect(result.errors).toEqual([]);
  });

  test("filters out bot communities from userbot sync selection", async () => {
    const state = createFakeState({
      communities: [
        {
          chatId: BigInt(-1000000000009),
          chatTitle: "Bot Community",
          id: "community-bot",
          parserType: "bot",
        },
      ],
    });

    const result = await runSyncOnce({
      createClient: async () => createFakeBundle(state),
      createDb: () => createFakeDb(state),
      hasFile: async () => true,
      loadConfig: () => createConfig(),
      loadDatabaseUrl: () => "postgres://db",
      logger: createLogger(),
      sleep: async () => undefined,
    });

    expect(result.stats.communitiesScanned).toBe(0);
    expect(result.stats.communitiesProcessed).toBe(0);
    expect(result.stats.insertedMessages).toBe(0);
  });

  test("skips insertion when no new Telegram messages are available", async () => {
    const state = createFakeState({
      communities: [
        {
          chatId: BigInt(-1000000000001),
          chatTitle: "Community",
          id: "community-1",
          parserType: "userbot",
        },
      ],
      latestStoredMessageId: BigInt(42),
      latestTelegramMessageId: 42,
    });

    const result = await runSyncOnce({
      createClient: async () => createFakeBundle(state),
      createDb: () => createFakeDb(state),
      hasFile: async () => true,
      loadConfig: () => createConfig(),
      loadDatabaseUrl: () => "postgres://db",
      logger: createLogger(),
      sleep: async () => undefined,
    });

    expect(result.stats.communitiesUpToDate).toBe(1);
    expect(result.stats.insertedMessages).toBe(0);
    expect(result.stats.telegramMessagesFetched).toBe(0);
    expect(state.getHistoryCalls).toEqual([
      {
        chatId: Number(BigInt(-1000000000001)),
        limit: 1,
      },
    ]);
  });

  test("inserts unseen text messages from initial backfill", async () => {
    const state = createFakeState({
      communities: [
        {
          chatId: BigInt(-1000000000002),
          chatTitle: "Community",
          id: "community-1",
          parserType: "userbot",
        },
      ],
      initialHistory: [
        {
          date: new Date("2026-01-01T00:00:00.000Z"),
          id: 3,
          isService: true,
          media: null,
          sender: { displayName: "Alice", id: 1, type: "user", username: "alice" },
          text: "service",
        } satisfies MessageRecord,
        {
          date: new Date("2026-01-01T00:01:00.000Z"),
          id: 4,
          isService: false,
          media: null,
          sender: { displayName: "Alice", id: 1, type: "user", username: "alice" },
          text: "hello",
        } satisfies MessageRecord,
        {
          date: new Date("2026-01-01T00:02:00.000Z"),
          id: 5,
          isService: false,
          media: { type: "webpage" },
          sender: { displayName: "Alice", id: 1, type: "user", username: "alice" },
          text: "link preview message",
        } satisfies MessageRecord,
      ],
      latestStoredMessageId: null,
      latestTelegramMessageId: 5,
    });

    const result = await runSyncOnce({
      createClient: async () => createFakeBundle(state),
      createDb: () => createFakeDb(state),
      hasFile: async () => true,
      loadConfig: () => createConfig(),
      loadDatabaseUrl: () => "postgres://db",
      logger: createLogger(),
      sleep: async () => undefined,
    });

    expect(result.stats.communitiesWithNoStoredMessages).toBe(1);
    expect(result.stats.telegramMessagesFetched).toBe(3);
    expect(result.stats.skippedNonText).toBe(1);
    expect(result.stats.insertedUsers).toBe(1);
    expect(result.stats.insertedMemberships).toBe(1);
    expect(result.stats.insertedMessages).toBe(2);
    expect(state.getHistoryCalls).toEqual([
      {
        chatId: Number(BigInt(-1000000000002)),
        limit: 1,
      },
      {
        chatId: Number(BigInt(-1000000000002)),
        limit: 200,
      },
    ]);
  });

  test("tracks unsupported raw message shapes explicitly", async () => {
    const state = createFakeState({
      communities: [
        {
          chatId: BigInt(-1000000000005),
          chatTitle: "Community",
          id: "community-1",
          parserType: "userbot",
        },
      ],
      latestStoredMessageId: null,
      latestTelegramMessageId: 5,
      initialHistory: [
        { bad: "shape" },
        {
          date: new Date("2026-01-01T00:01:00.000Z"),
          id: 4,
          isService: false,
          media: null,
          sender: { displayName: "Alice", id: 1, type: "user", username: "alice" },
          text: "hello",
        } satisfies MessageRecord,
      ],
    });

    const result = await runSyncOnce({
      createClient: async () => createFakeBundle(state),
      createDb: () => createFakeDb(state),
      hasFile: async () => true,
      loadConfig: () => createConfig(),
      loadDatabaseUrl: () => "postgres://db",
      logger: createLogger(),
      sleep: async () => undefined,
    });

    expect(result.stats.skippedUnsupportedShape).toBe(1);
    expect(result.stats.insertedMessages).toBe(1);
  });

  test("does not double-insert with overlap between stored and fetched history", async () => {
    const state = createFakeState({
      communities: [
        {
          chatId: BigInt(-1000000000003),
          chatTitle: "Community",
          id: "community-1",
          parserType: "userbot",
        },
      ],
      incrementalHistory: [
        {
          date: new Date("2026-01-02T00:00:00.000Z"),
          id: 10,
          isService: false,
          media: null,
          sender: { displayName: "Bob", id: 2, type: "user", username: "bob" },
          text: "already saved",
        } satisfies MessageRecord,
        {
          date: new Date("2026-01-02T00:01:00.000Z"),
          id: 11,
          isService: false,
          media: null,
          sender: { displayName: "Bob", id: 2, type: "user", username: "bob" },
          text: "duplicate overlap",
        } satisfies MessageRecord,
        {
          date: new Date("2026-01-02T00:02:00.000Z"),
          id: 12,
          isService: false,
          media: null,
          sender: { displayName: "Bob", id: 2, type: "user", username: "bob" },
          text: "fresh message",
        } satisfies MessageRecord,
      ],
      latestStoredMessageId: BigInt(10),
      latestTelegramMessageId: 12,
    });
    state.existingMessageKeys.add("community-1:11");

    const result = await runSyncOnce({
      createClient: async () => createFakeBundle(state),
      createDb: () => createFakeDb(state),
      hasFile: async () => true,
      loadConfig: () => createConfig(),
      loadDatabaseUrl: () => "postgres://db",
      logger: createLogger(),
      sleep: async () => undefined,
    });

    expect(result.stats.skippedOldOrEqual).toBe(1);
    expect(result.stats.duplicateMessages).toBe(1);
    expect(result.stats.insertedMessages).toBe(1);
    expect(state.iterHistoryCalls).toEqual([
      {
        chatId: Number(BigInt(-1000000000003)),
        minId: 10,
      },
    ]);
  });

  test("retries transient Telegram failures with bounded backoff", async () => {
    const state = createFakeState({
      communities: [
        {
          chatId: BigInt(-1000000000010),
          chatTitle: "Community",
          id: "community-1",
          parserType: "userbot",
        },
      ],
      getHistoryLimitOneFailCount: 1,
      latestStoredMessageId: BigInt(7),
      latestTelegramMessageId: 7,
    });

    const result = await runSyncOnce({
      createClient: async () => createFakeBundle(state),
      createDb: () => createFakeDb(state),
      hasFile: async () => true,
      loadConfig: () => createConfig(),
      loadDatabaseUrl: () => "postgres://db",
      logger: createLogger(),
      sleep: async () => undefined,
    });

    expect(result.stats.retryCount).toBe(1);
    expect(result.stats.communitiesFailed).toBe(0);
    expect(result.stats.communitiesUpToDate).toBe(1);
  });
});
