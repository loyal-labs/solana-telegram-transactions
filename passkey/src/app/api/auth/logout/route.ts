import { NextResponse } from "next/server";

import { getServerConfig } from "@/lib/core/config/server";
import {
  createSessionCookieService,
  EMAIL_AUTH_SESSION_COOKIE_NAME,
} from "@/lib/auth/email/session-cookie";

export async function POST(request: Request) {
  const sessionCookieService = createSessionCookieService({
    getConfig: () => getServerConfig(),
  });
  const response = new NextResponse(null, { status: 204 });

  response.cookies.set({
    name: EMAIL_AUTH_SESSION_COOKIE_NAME,
    value: "",
    ...sessionCookieService.createClearedSessionCookieOptions(request),
  });

  return response;
}
