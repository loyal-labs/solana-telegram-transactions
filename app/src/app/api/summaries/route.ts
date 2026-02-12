import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/core/database";
import { communities, summaries, type Summary } from "@/lib/core/schema";

type CommunityPhotoSettings = {
  photoBase64?: string;
  photoMimeType?: string;
};

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const db = getDatabase();

    const result = chatId
      ? await fetchSummariesByChatId(db, chatId)
      : await db.query.summaries.findMany({
          with: { community: true },
          orderBy: [desc(summaries.createdAt)],
        });

    const transformedSummaries = result.map((item) => {
      const settings = item.community.settings as CommunityPhotoSettings | null;
      return {
        id: item.id,
        chatId: String(item.community.chatId),
        title: item.chatTitle,
        messageCount: item.messageCount,
        oneliner: item.oneliner,
        photoBase64: settings?.photoBase64,
        photoMimeType: settings?.photoMimeType,
        topics: item.topics.map((topic, index) => ({
          id: `${item.id}-${index}`,
          title: topic.title,
          content: topic.content,
          sources: topic.sources,
        })),
        createdAt: item.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ summaries: transformedSummaries });
  } catch (error) {
    console.error("[api/summaries] Failed to fetch summaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch summaries" },
      { status: 500 }
    );
  }
}

type SummaryWithCommunity = Summary & {
  community: { chatId: bigint; settings: unknown };
};

async function fetchSummariesByChatId(
  db: ReturnType<typeof getDatabase>,
  chatId: string
): Promise<SummaryWithCommunity[]> {
  const community = await db.query.communities.findFirst({
    where: eq(communities.chatId, BigInt(chatId)),
  });

  if (!community) return [];

  const summaryResults = await db.query.summaries.findMany({
    where: eq(summaries.communityId, community.id),
    orderBy: [desc(summaries.createdAt)],
  });

  return summaryResults.map((s) => ({ ...s, community }));
}
