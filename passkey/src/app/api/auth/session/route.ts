import { NextResponse } from "next/server";

import { getServerConfig } from "@/lib/core/config/server";
import { createSessionCookieService } from "@/lib/auth/email/session-cookie";

export async function GET(request: Request) {
  const sessionCookieService = createSessionCookieService({
    getConfig: () => getServerConfig(),
  });
  const user = await sessionCookieService.readSessionFromRequest(request);

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "unauthenticated",
          message: "No active auth session.",
        },
      },
      { status: 401 }
    );
  }

  return NextResponse.json({ user });
}
