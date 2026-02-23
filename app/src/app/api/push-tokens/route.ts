import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/core/database";
import { pushTokens } from "@/lib/core/schema";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { token, telegramUserId, platform } = body;

    if (!token || !telegramUserId || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: token, telegramUserId, platform" },
        { status: 400 },
      );
    }

    const db = getDatabase();

    await db
      .insert(pushTokens)
      .values({
        token,
        telegramUserId: BigInt(telegramUserId),
        platform,
      })
      .onConflictDoUpdate({
        target: pushTokens.token,
        set: {
          telegramUserId: BigInt(telegramUserId),
          platform,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/push-tokens] Failed to register token:", error);
    return NextResponse.json(
      { error: "Failed to register push token" },
      { status: 500 },
    );
  }
}
