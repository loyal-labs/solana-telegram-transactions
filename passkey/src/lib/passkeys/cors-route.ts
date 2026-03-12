import { getServerConfig } from "@/lib/core/config/server";
import {
  AuthCorsError,
  createAuthCorsPreflightResponse,
  createForbiddenOriginResponse,
  getAuthCorsHeaders,
  withAuthCorsHeaders,
} from "@/lib/auth/cors";
import { proxyPasskeyOperation } from "@/lib/passkeys/grid-proxy";

type CorsProxyOperation = "createSession" | "authorizeSession";

export function createPasskeyCorsRouteHandlers(operation: CorsProxyOperation) {
  return {
    OPTIONS(request: Request) {
      try {
        return createAuthCorsPreflightResponse(request, getServerConfig());
      } catch (error) {
        if (error instanceof AuthCorsError) {
          return createForbiddenOriginResponse();
        }

        throw error;
      }
    },

    async POST(request: Request) {
      const config = getServerConfig();

      try {
        const corsHeaders = getAuthCorsHeaders(request, config);
        const response = await proxyPasskeyOperation({
          operation,
          request,
        });

        return withAuthCorsHeaders(response, corsHeaders);
      } catch (error) {
        if (error instanceof AuthCorsError) {
          return createForbiddenOriginResponse();
        }

        throw error;
      }
    },
  };
}
