"use server";

import { NextResponse } from "next/server";

import { getReadyBuilderClient } from "@/lib/nillion/core/builder";
import { COMMUNITY_CHAT_SUMMARIES_COLLECTION_ID } from "@/lib/nillion/schemas/community-chat-summaries-schema";

type SummaryRecord = {
  _id: string;
  chat_id: string;
  chat_title: string;
  message_count?: number;
  topics: Array<{
    title: string;
    content: string;
    sources: string[];
  }>;
  created_at: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    const builderClient = await getReadyBuilderClient();

    const filter = chatId ? { chat_id: chatId } : {};

    const result = await builderClient.findData({
      collection: COMMUNITY_CHAT_SUMMARIES_COLLECTION_ID,
      filter,
    });

    const rawData = (result?.data || []) as SummaryRecord[];

    // Transform the data to match the expected format
    const summaries = rawData.map((item) => ({
      id: item._id,
      chatId: item.chat_id,
      title: item.chat_title,
      messageCount: item.message_count,
      topics: item.topics.map((topic, index) => ({
        id: `${item._id}-${index}`,
        title: topic.title,
        content: topic.content,
        sources: topic.sources,
      })),
      createdAt: item.created_at,
    }));

    // Sort by created_at descending
    summaries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error("[api/summaries] Failed to fetch summaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch summaries" },
      { status: 500 }
    );
  }
}
