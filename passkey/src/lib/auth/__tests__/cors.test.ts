import { describe, expect, test } from "bun:test";

import {
  AuthCorsError,
  createAuthCorsPreflightResponse,
  getAuthCorsHeaders,
  resolveAllowedAuthOrigin,
} from "@/lib/auth/cors";
import type { PasskeyServerConfig } from "@/lib/core/config/types";

const config: PasskeyServerConfig = {
  gridEnvironment: "sandbox",
  allowedParentDomain: "askloyal.com",
  allowLocalhost: true,
  rpId: "askloyal.com",
  gridApiBaseUrl: "https://grid.squads.xyz",
  appName: "askloyal",
  authJwtSecret: "12345678901234567890123456789012",
  authJwtTtlSeconds: 60,
};

function createRequest(origin?: string): Request {
  return new Request("https://auth.askloyal.com/api/auth/email/start", {
    headers: origin ? { origin } : undefined,
    method: "POST",
  });
}

describe("auth CORS helper", () => {
  test("allows localhost origins with any port", () => {
    expect(resolveAllowedAuthOrigin(createRequest("http://localhost:3000"), config)).toBe(
      "http://localhost:3000"
    );
    expect(resolveAllowedAuthOrigin(createRequest("http://localhost:3001"), config)).toBe(
      "http://localhost:3001"
    );
  });

  test("allows askloyal subdomain origins", () => {
    expect(
      resolveAllowedAuthOrigin(createRequest("https://app.askloyal.com"), config)
    ).toBe("https://app.askloyal.com");
    expect(
      resolveAllowedAuthOrigin(createRequest("https://admin.askloyal.com"), config)
    ).toBe("https://admin.askloyal.com");
  });

  test("rejects disallowed origins", () => {
    expect(() =>
      resolveAllowedAuthOrigin(createRequest("http://127.0.0.1:3000"), config)
    ).toThrow(AuthCorsError);
    expect(() =>
      resolveAllowedAuthOrigin(createRequest("https://example.com"), config)
    ).toThrow(AuthCorsError);
  });

  test("returns no CORS headers when origin is absent", () => {
    expect(Array.from(getAuthCorsHeaders(createRequest(), config).entries())).toEqual([]);
  });

  test("builds exact-origin credentialed headers", () => {
    const headers = getAuthCorsHeaders(
      createRequest("http://localhost:3000"),
      config
    );

    expect(headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect(headers.get("access-control-allow-credentials")).toBe("true");
    expect(headers.get("access-control-allow-headers")).toBe("content-type");
    expect(headers.get("access-control-allow-methods")).toBe("GET, POST, OPTIONS");
    expect(headers.get("vary")).toBe("Origin");
  });

  test("returns a 204 preflight response with CORS headers", () => {
    const response = createAuthCorsPreflightResponse(
      createRequest("http://localhost:3000"),
      config
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000"
    );
  });
});
