import type { TelegramHistoryClient } from "./types";

const INITIAL_BACKFILL_LIMIT = 200;
const HISTORY_CHUNK_SIZE = 200;

function readMessageId(message: unknown): number | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  const id = (message as { id?: unknown }).id;
  if (!Number.isInteger(id) || (id as number) <= 0) {
    return null;
  }

  return id as number;
}

export async function getLatestTelegramMessageId(
  client: TelegramHistoryClient,
  chatId: number
): Promise<number | null> {
  const latestHistory = await client.getHistory(chatId, { limit: 1 });
  return readMessageId(latestHistory[0] ?? null);
}

export async function* fetchUnseenMessages(
  client: TelegramHistoryClient,
  chatId: number,
  lastStoredMessageId: number | null
): AsyncGenerator<unknown> {
  if (lastStoredMessageId === null) {
    const initialBatch = await client.getHistory(chatId, {
      limit: INITIAL_BACKFILL_LIMIT,
    });

    // Keep first-sync deterministic in ascending message-id order.
    const orderedInitialBatch = [...initialBatch].sort((left, right) => {
      const leftId = readMessageId(left);
      const rightId = readMessageId(right);
      if (leftId === null || rightId === null) {
        return 0;
      }

      return leftId - rightId;
    });

    for (const message of orderedInitialBatch) {
      yield message;
    }
    return;
  }

  for await (const message of client.iterHistory(chatId, {
    chunkSize: HISTORY_CHUNK_SIZE,
    minId: lastStoredMessageId,
  })) {
    yield message;
  }
}
