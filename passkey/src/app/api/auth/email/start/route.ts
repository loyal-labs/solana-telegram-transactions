import { EmailAuthError } from "@/lib/auth/email/errors";
import { startEmailAuth } from "@/lib/auth/email/service";
import { handleAuthJsonPost, handleAuthOptions } from "@/lib/auth/route-handler";

export function OPTIONS(request: Request) {
  return handleAuthOptions(request);
}

export async function POST(request: Request) {
  return handleAuthJsonPost(request, {
    execute: (body) => startEmailAuth(body),
    mapKnownError: (error) =>
      error instanceof EmailAuthError
        ? {
            code: error.code,
            status: error.status,
            message: error.message,
            details: error.details,
          }
        : null,
    defaultError: {
      code: "email_auth_start_failed",
      message: "Failed to start email authentication",
    },
  });
}
