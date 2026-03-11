import type { EmailAuthUser } from "@loyal-labs/grid-core";

import type { PasskeyServerConfig } from "@/lib/core/config/types";
import { resolvePasskeyRequestContext } from "@/lib/passkeys/host-resolution";

import {
  issueEmailAccessToken,
  verifyEmailAccessToken,
} from "./access-token";

export const EMAIL_AUTH_SESSION_COOKIE_NAME = "loyal_email_session";

export type SessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
  domain?: string;
};

export interface SessionCookieService {
  issueSessionToken(user: EmailAuthUser): Promise<string>;
  readSessionFromRequest(request: Request): Promise<EmailAuthUser | null>;
  createSessionCookieOptions(request: Request): SessionCookieOptions;
  createClearedSessionCookieOptions(request: Request): SessionCookieOptions;
}

type SessionCookieServiceDependencies = {
  getConfig: () => PasskeyServerConfig;
};

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [name, ...rest] = part.trim().split("=");
    if (!name || rest.length === 0) {
      return acc;
    }

    acc[name] = rest.join("=");
    return acc;
  }, {});
}

function resolveCookieOptions(
  request: Request,
  config: PasskeyServerConfig,
  maxAge: number
): SessionCookieOptions {
  const context = resolvePasskeyRequestContext({
    requestUrl: request.url,
    headers: request.headers,
    options: {
      allowedParentDomain: config.allowedParentDomain,
      allowLocalhost: config.allowLocalhost,
      rpId: config.rpId,
    },
  });

  return {
    httpOnly: true,
    sameSite: "lax",
    secure: !context.isLocalhost,
    path: "/",
    maxAge,
    ...(context.isLocalhost ? {} : { domain: config.allowedParentDomain }),
  };
}

export function createSessionCookieService(
  dependencies: SessionCookieServiceDependencies
): SessionCookieService {
  return {
    async issueSessionToken(user: EmailAuthUser) {
      const config = dependencies.getConfig();
      return issueEmailAccessToken(
        {
          sub: user.gridUserId,
          email: user.email,
          accountAddress: user.accountAddress,
          authMethod: "email",
          ...(user.provider ? { provider: user.provider } : {}),
        },
        config.authJwtSecret,
        config.authJwtTtlSeconds
      );
    },

    async readSessionFromRequest(request: Request) {
      const config = dependencies.getConfig();
      const cookies = parseCookieHeader(request.headers.get("cookie"));
      const token = cookies[EMAIL_AUTH_SESSION_COOKIE_NAME];

      if (!token) {
        return null;
      }

      try {
        const claims = await verifyEmailAccessToken(token, config.authJwtSecret);
        return {
          email: claims.email,
          gridUserId: claims.sub,
          accountAddress: claims.accountAddress,
          ...(claims.provider ? { provider: claims.provider } : {}),
        };
      } catch {
        return null;
      }
    },

    createSessionCookieOptions(request: Request) {
      const config = dependencies.getConfig();
      return resolveCookieOptions(request, config, config.authJwtTtlSeconds);
    },

    createClearedSessionCookieOptions(request: Request) {
      const config = dependencies.getConfig();
      return resolveCookieOptions(request, config, 0);
    },
  };
}
