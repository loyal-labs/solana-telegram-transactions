import { NextResponse } from "next/server";

import { getBot } from "@/lib/telegram/bot-api/bot";
import { registerBotCommands } from "@/lib/telegram/bot-api/register-commands";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.ASKLOYAL_TGBOT_KEY;

  if (authHeader !== `Bearer ${expectedToken}`) {
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
