import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { EmailAuthError } from "@/lib/auth/email/errors";
import { startEmailAuth } from "@/lib/auth/email/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await startEmailAuth(body);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof EmailAuthError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details !== undefined ? { details: error.details } : {}),
          },
        },
        { status: error.status }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_request",
            message: "Invalid request payload",
            details: error.issues.map((issue) => issue.message),
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_json",
            message: "Request body must be valid JSON",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "email_auth_start_failed",
          message:
            error instanceof Error
              ? error.message
              : "Failed to start email authentication",
        },
      },
      { status: 500 }
    );
  }
}
