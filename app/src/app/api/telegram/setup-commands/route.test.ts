import { afterEach, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

const TEST_ENV_KEYS = ["TELEGRAM_SETUP_SECRET", "ASKLOYAL_TGBOT_KEY"] as const;

function clearTestEnv(): void {
  for (const key of TEST_ENV_KEYS) {
    delete process.env[key];
  }
}

let POST: (request: Request) => Promise<Response>;

describe("setup-commands route auth", () => {
  beforeAll(async () => {
    const loadedModule = await import("./route");
    POST = loadedModule.POST;
  });

  beforeEach(() => {
    clearTestEnv();
  });

  afterEach(() => {
    clearTestEnv();
  });

  test("returns 500 when TELEGRAM_SETUP_SECRET is missing", async () => {
    const request = new Request("http://localhost/api/telegram/setup-commands", {
      method: "POST",
      headers: { authorization: "Bearer any-token" },
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const payload = await response.json();
    expect(payload).toEqual({ error: "Server misconfigured" });
  });

  test("returns 401 when Authorization does not match TELEGRAM_SETUP_SECRET", async () => {
    process.env.TELEGRAM_SETUP_SECRET = "expected-secret";

    const request = new Request("http://localhost/api/telegram/setup-commands", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const payload = await response.json();
    expect(payload).toEqual({ error: "Unauthorized" });
  });
});
