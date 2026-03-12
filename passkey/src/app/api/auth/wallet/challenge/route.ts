import { handleAuthJsonPost, handleAuthOptions } from "@/lib/auth/route-handler";
import { createWalletAuthChallenge } from "@/lib/auth/wallet-service";
import { WalletAuthError } from "@/lib/auth/wallet-errors";

export function OPTIONS(request: Request) {
  return handleAuthOptions(request);
}

export async function POST(request: Request) {
  return handleAuthJsonPost(request, {
    execute: (body) =>
      createWalletAuthChallenge(body, {
        requestOrigin:
          request.headers.get("origin") ?? new URL(request.url).origin,
      }),
    mapKnownError: (error) =>
      error instanceof WalletAuthError
        ? {
            code: error.code,
            status: error.status,
            message: error.message,
            details: error.details,
          }
        : null,
    defaultError: {
      code: "wallet_auth_failed",
      message: "Failed to create a wallet challenge",
    },
  });
}
