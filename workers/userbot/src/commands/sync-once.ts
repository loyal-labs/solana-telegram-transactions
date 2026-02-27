import { stat } from "node:fs/promises";

import { communities, messages } from "@loyal-labs/db-core/schema";
import { and, desc, eq } from "drizzle-orm";

import { createUserbotClient, type UserbotClientBundle } from "../lib/client";
import { createWorkerDatabase, loadDatabaseUrl, type UserbotDb } from "../lib/database";
import { loadUserbotConfig, type UserbotConfig } from "../lib/env";
import { createNonInteractiveAuthCallbacks } from "../lib/non-interactive-auth";
import { fetchUnseenMessages, getLatestTelegramMessageId } from "../lib/sync/history-source";
import { toIngestibleMessage } from "../lib/sync/message-filter";
import { persistEligibleMessage } from "../lib/sync/persistence";
import { resolveSessionSqlitePath } from "../lib/storage";

type EnvRecord = Record<string, string | undefined>;

type Logger = Pick<Console, "error" | "info" | "warn">;

type SyncOnceDeps = {
  createClient: (config: UserbotConfig) => Promise<UserbotClientBundle>;
  createDb: (databaseUrl: string) => UserbotDb;
  env: EnvRecord;
  hasFile: (path: string) => Promise<boolean>;
  loadConfig: (env: EnvRecord) => UserbotConfig;
  loadDatabaseUrl: (env: EnvRecord) => string;
  logger: Logger;
  sleep: (ms: number) => Promise<void>;
};

type ActiveUserbotCommunity = {
  chatId: bigint;
  chatTitle: string;
  id: string;
};

type CommunitySyncError = {
  chatId: string;
  communityId: string;
  error: string;
};

export type SyncOnceStats = {
  communitiesFailed: number;
  communitiesProcessed: number;
  communitiesScanned: number;
  communitiesUpToDate: number;
  communitiesWithNoStoredMessages: number;
  communitiesWithNoTelegramHistory: number;
  duplicateMessages: number;
  insertedMemberships: number;
  insertedMessages: number;
  insertedUsers: number;
  retryCount: number;
  skippedNonText: number;
  skippedNonUserSender: number;
  skippedOldOrEqual: number;
  skippedUnsupportedShape: number;
  telegramMessagesConsidered: number;
  telegramMessagesFetched: number;
  userMetadataUpdates: number;
};

export type SyncOnceResult = {
  errors: CommunitySyncError[];
  stats: SyncOnceStats;
};

const RETRY_BASE_DELAY_MS = 250;
const RETRY_MAX_ATTEMPTS = 3;

function isDirectExecution(scriptName: string): boolean {
  const entrypoint = process.argv[1];
  return typeof entrypoint === "string" && entrypoint.endsWith(scriptName);
}

async function hasFile(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveDeps(overrides: Partial<SyncOnceDeps>): SyncOnceDeps {
  return {
    createClient: overrides.createClient ?? createUserbotClient,
    createDb: overrides.createDb ?? createWorkerDatabase,
    env: overrides.env ?? process.env,
    hasFile: overrides.hasFile ?? hasFile,
    loadConfig: overrides.loadConfig ?? loadUserbotConfig,
    loadDatabaseUrl: overrides.loadDatabaseUrl ?? loadDatabaseUrl,
    logger: overrides.logger ?? console,
    sleep: overrides.sleep ?? sleep,
  };
}

function createInitialStats(communitiesScanned: number): SyncOnceStats {
  return {
    communitiesFailed: 0,
    communitiesProcessed: 0,
    communitiesScanned,
    communitiesUpToDate: 0,
    communitiesWithNoStoredMessages: 0,
    communitiesWithNoTelegramHistory: 0,
    duplicateMessages: 0,
    insertedMemberships: 0,
    insertedMessages: 0,
    insertedUsers: 0,
    retryCount: 0,
    skippedNonText: 0,
    skippedNonUserSender: 0,
    skippedOldOrEqual: 0,
    skippedUnsupportedShape: 0,
    telegramMessagesConsidered: 0,
    telegramMessagesFetched: 0,
    userMetadataUpdates: 0,
  };
}

function isTransientError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toUpperCase() : String(error).toUpperCase();
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  if (["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"].includes(code)) {
    return true;
  }

  return (
    message.includes("FLOOD_WAIT") ||
    message.includes("RPC_CALL_FAIL") ||
    message.includes("TIMEOUT") ||
    message.includes("NETWORK")
  );
}

async function runWithRetry<T>(
  deps: SyncOnceDeps,
  stats: SyncOnceStats,
  label: string,
  task: () => Promise<T>
): Promise<T> {
  let attempt = 0;

  while (attempt < RETRY_MAX_ATTEMPTS) {
    attempt += 1;
    try {
      return await task();
    } catch (error) {
      const shouldRetry = isTransientError(error) && attempt < RETRY_MAX_ATTEMPTS;
      if (!shouldRetry) {
        throw error;
      }

      stats.retryCount += 1;
      const delayMs = RETRY_BASE_DELAY_MS * attempt;
      deps.logger.warn(
        `[userbot] transient error while ${label}; retrying in ${delayMs}ms`,
        error
      );
      await deps.sleep(delayMs);
    }
  }

  throw new Error(`Failed retry loop for ${label}`);
}

async function destroyBundle(
  bundle: UserbotClientBundle,
  logger: Logger,
  context: string
): Promise<void> {
  try {
    await bundle.client.destroy();
  } catch (error) {
    logger.error(`[userbot] Failed to destroy client (${context})`, error);
  }
}

async function syncCommunity(
  db: UserbotDb,
  bundle: UserbotClientBundle,
  community: ActiveUserbotCommunity,
  stats: SyncOnceStats,
  userIdCache: Map<string, string>,
  membershipCache: Set<string>
): Promise<void> {
  const latestStored = await db.query.messages.findFirst({
    columns: { telegramMessageId: true },
    orderBy: [desc(messages.telegramMessageId)],
    where: eq(messages.communityId, community.id),
  });
  const latestStoredMessageId =
    latestStored?.telegramMessageId !== undefined
      ? Number(latestStored.telegramMessageId)
      : null;

  if (latestStoredMessageId === null) {
    stats.communitiesWithNoStoredMessages += 1;
  }

  const chatPeerId = Number(community.chatId);
  const latestTelegramMessageId = await getLatestTelegramMessageId(
    bundle.client,
    chatPeerId
  );
  if (latestTelegramMessageId === null) {
    stats.communitiesWithNoTelegramHistory += 1;
    return;
  }

  if (
    latestStoredMessageId !== null &&
    latestTelegramMessageId <= latestStoredMessageId
  ) {
    stats.communitiesUpToDate += 1;
    return;
  }

  for await (const rawMessage of fetchUnseenMessages(
    bundle.client,
    chatPeerId,
    latestStoredMessageId
  )) {
    stats.telegramMessagesFetched += 1;
    stats.telegramMessagesConsidered += 1;

    const message = toIngestibleMessage(rawMessage, stats);
    if (!message) {
      continue;
    }

    if (
      latestStoredMessageId !== null &&
      message.messageId <= latestStoredMessageId
    ) {
      stats.skippedOldOrEqual += 1;
      continue;
    }

    await persistEligibleMessage({
      communityId: community.id,
      db,
      membershipCache,
      message,
      stats,
      userIdCache,
    });
  }
}

export async function runSyncOnce(
  overrides: Partial<SyncOnceDeps> = {}
): Promise<SyncOnceResult> {
  const deps = resolveDeps(overrides);
  const config = deps.loadConfig(deps.env);
  const sessionPath = resolveSessionSqlitePath(
    config.accountKey,
    config.storageDir
  );

  if (!(await deps.hasFile(sessionPath))) {
    throw new Error(
      `[userbot] Missing session file for '${config.accountKey}'. Run auth:bootstrap first. Expected: ${sessionPath}`
    );
  }

  const bundle = await deps.createClient(config);
  const userIdCache = new Map<string, string>();
  const membershipCache = new Set<string>();

  try {
    await bundle.client.start(
      createNonInteractiveAuthCallbacks(
        `Session for '${config.accountKey}' is invalid. Run bun run auth:bootstrap.`
      )
    );

    const databaseUrl = deps.loadDatabaseUrl(deps.env);
    const db = deps.createDb(databaseUrl);

    const userbotCommunities = await db.query.communities.findMany({
      columns: {
        chatId: true,
        chatTitle: true,
        id: true,
      },
      where: and(
        eq(communities.isActive, true),
        eq(communities.parserType, "userbot")
      ),
    });

    const stats = createInitialStats(userbotCommunities.length);
    const errors: CommunitySyncError[] = [];

    for (const community of userbotCommunities) {
      stats.communitiesProcessed += 1;

      try {
        await runWithRetry(
          deps,
          stats,
          `syncing community ${community.id}`,
          async () => {
            await syncCommunity(
              db,
              bundle,
              community,
              stats,
              userIdCache,
              membershipCache
            );
          }
        );
      } catch (error) {
        stats.communitiesFailed += 1;
        errors.push({
          chatId: community.chatId.toString(),
          communityId: community.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const result = {
      errors,
      stats,
    };

    deps.logger.info("[userbot] sync:once completed", result);
    return result;
  } finally {
    await destroyBundle(bundle, deps.logger, "sync_once");
  }
}

export async function runSyncOnceCli(
  overrides: Partial<SyncOnceDeps> = {}
): Promise<number> {
  const logger = overrides.logger ?? console;

  try {
    await runSyncOnce(overrides);
    return 0;
  } catch (error) {
    logger.error("[userbot] sync:once failed to start", error);
    return 1;
  }
}

if (isDirectExecution("sync-once.ts")) {
  process.exit(await runSyncOnceCli());
}
