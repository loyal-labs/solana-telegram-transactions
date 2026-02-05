import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { getBot } from "@/lib/telegram/bot-api/bot";
import { registerBotCommands } from "@/lib/telegram/bot-api/register-commands";

export async function POST(request: Request) {
  const expectedToken = process.env.ASKLOYAL_TGBOT_KEY;
  if (!expectedToken) {
    console.error("ASKLOYAL_TGBOT_KEY environment variable is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use timing-safe comparison to prevent timing attacks
  const expected = Buffer.from(`Bearer ${expectedToken}`);
  const provided = Buffer.from(authHeader);
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bot = await getBot();
    await registerBotCommands(bot);
    return NextResponse.json({ success: true, message: "Commands registered" });
  } catch (error) {
    console.error("Failed to register commands:", error);
    return NextResponse.json(
      { error: "Failed to register commands" },
      { status: 500 }
    );
  }
}
