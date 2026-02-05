import { eq } from "drizzle-orm";

import { getDatabase } from "@/lib/core/database";
import { users } from "@/lib/core/schema";

// Cache of known users (telegramId string -> userUUID)
const knownUsers = new Map<string, string>();

/**
 * Gets or creates a user by their Telegram ID.
 * Uses an in-memory cache to avoid repeated database queries.
 * Returns the user's UUID.
 */
export async function getOrCreateUser(
  telegramId: bigint,
  userData: {
    username: string | null;
    displayName: string;
  }
): Promise<string> {
  const telegramIdStr = String(telegramId);

  // Check cache first
  const cachedUserId = knownUsers.get(telegramIdStr);
  if (cachedUserId) {
    return cachedUserId;
  }

  const db = getDatabase();

  // Check database
  const existingUser = await db.query.users.findFirst({
    where: eq(users.telegramId, telegramId),
  });

  if (existingUser) {
    knownUsers.set(telegramIdStr, existingUser.id);
    return existingUser.id;
  }

  // Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      telegramId,
      username: userData.username,
      displayName: userData.displayName,
    })
    .returning({ id: users.id });

  knownUsers.set(telegramIdStr, newUser.id);
  return newUser.id;
}
