import { communities } from "@loyal-labs/db-core/schema";
import { and, eq } from "drizzle-orm";

type CacheEntry = {
  communityId: string;
  parserType: "bot" | "userbot";
};

type CommunityRecord = {
  id: string;
  parserType: "bot" | "userbot";
} | null;

type CommunityQueryDb = {
  query: {
    communities: {
      findFirst: unknown;
    };
  };
};

type FindActiveCommunity = (args: {
  columns: {
    id: true;
    parserType: true;
  };
  where: unknown;
}) => Promise<CommunityRecord>;

function findActiveCommunity(
  db: CommunityQueryDb,
  where: unknown
): Promise<CommunityRecord> {
  const findFirst = db.query.communities.findFirst as FindActiveCommunity;
  return findFirst({
    columns: {
      id: true,
      parserType: true,
    },
    where,
  });
}

// Cache of active community state (chatId string -> parser-aware record).
const activeCommunities = new Map<string, CacheEntry>();

export function evictActiveCommunityCache(
  chatId: bigint | number | string
): void {
  activeCommunities.delete(String(chatId));
}

export async function resolveActiveBotCommunityId(
  db: CommunityQueryDb,
  chatId: bigint
): Promise<string | null> {
  const chatIdStr = String(chatId);
  const cached = activeCommunities.get(chatIdStr);

  if (cached) {
    // Revalidate cached mapping so parser flips (bot -> userbot) are respected.
    const stillActive = await findActiveCommunity(
      db,
      and(
        eq(communities.id, cached.communityId),
        eq(communities.chatId, chatId),
        eq(communities.isActive, true)
      )
    );

    if (!stillActive || stillActive.parserType !== "bot") {
      activeCommunities.delete(chatIdStr);
      return null;
    }

    activeCommunities.set(chatIdStr, {
      communityId: stillActive.id,
      parserType: stillActive.parserType,
    });
    return stillActive.id;
  }

  const community = await findActiveCommunity(
    db,
    and(
      eq(communities.chatId, chatId),
      eq(communities.isActive, true)
    )
  );

  if (!community || community.parserType !== "bot") {
    activeCommunities.delete(chatIdStr);
    return null;
  }

  activeCommunities.set(chatIdStr, {
    communityId: community.id,
    parserType: community.parserType,
  });
  return community.id;
}
