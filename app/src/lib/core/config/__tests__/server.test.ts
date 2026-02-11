import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

mock.module("server-only", () => ({}));

const SERVER_ENV_KEYS = [
  "DATABASE_URL",
  "REDPILL_AI_API_KEY",
  "DFLOW_API_KEY",
  "IRYS_SOLANA_KEY",
  "MESSAGE_ENCRYPTION_KEY",
  "DEPLOYMENT_PK",
  "ASKLOYAL_TGBOT_KEY",
  "TELEGRAM_SETUP_SECRET",
  "CLOUDFLARE_CDN_BASE_URL",
  "NEXT_PUBLIC_CLOUDFLARE_CDN_BASE_URL",
  "CLOUDFLARE_R2_PUBLIC_DEV_URL",
  "NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DEV_URL",
  "CLOUDFLARE_R2_ACCOUNT_ID",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_BUCKET_NAME",
  "CLOUDFLARE_R2_S3_ENDPOINT",
  "CLOUDFLARE_R2_UPLOAD_PREFIX",
] as const;

function clearServerEnv(): void {
  for (const key of SERVER_ENV_KEYS) {
    delete process.env[key];
  }
}

let serverEnv: {
  databaseUrl: string;
  redpillApiKey: string;
  dflowApiKey: string;
  irysSolanaKey: string;
  messageEncryptionKey: string | undefined;
  deploymentPrivateKey: string;
  askLoyalBotToken: string;
  telegramSetupSecret: string;
  cloudflareCdnBaseUrl: string | null;
  cloudflareR2UploadPrefix: string | undefined;
  cloudflareR2S3Endpoint: string | undefined;
  cloudflareR2AccountId: string;
  cloudflareR2AccessKeyId: string;
  cloudflareR2SecretAccessKey: string;
  cloudflareR2BucketName: string;
  isCloudflareR2UploadConfigured: boolean;
};

describe("server config", () => {
  beforeAll(async () => {
    const loadedModule = await import("../server");
    serverEnv = loadedModule.serverEnv;
  });

  beforeEach(() => {
    clearServerEnv();
  });

  afterEach(() => {
    clearServerEnv();
  });

  test("throws for missing required values", () => {
    expect(() => serverEnv.databaseUrl).toThrow("DATABASE_URL is not set");
    expect(() => serverEnv.telegramSetupSecret).toThrow(
      "TELEGRAM_SETUP_SECRET is not set"
    );
  });

  test("returns required values when present", () => {
    process.env.DATABASE_URL = "postgres://db";
    process.env.TELEGRAM_SETUP_SECRET = "secret";

    expect(serverEnv.databaseUrl).toBe("postgres://db");
    expect(serverEnv.telegramSetupSecret).toBe("secret");
  });

  test("returns optional values when present", () => {
    process.env.MESSAGE_ENCRYPTION_KEY = "  key  ";
    process.env.CLOUDFLARE_R2_S3_ENDPOINT = "  https://r2.example.com  ";
    process.env.CLOUDFLARE_R2_UPLOAD_PREFIX = "  uploads  ";

    expect(serverEnv.messageEncryptionKey).toBe("key");
    expect(serverEnv.cloudflareR2S3Endpoint).toBe("https://r2.example.com");
    expect(serverEnv.cloudflareR2UploadPrefix).toBe("uploads");
  });

  test("selects CDN base URL in documented priority order", () => {
    process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DEV_URL =
      "https://pub-last.r2.dev";
    process.env.CLOUDFLARE_R2_PUBLIC_DEV_URL = "https://pub-third.r2.dev";
    process.env.NEXT_PUBLIC_CLOUDFLARE_CDN_BASE_URL =
      "https://cdn-second.example.com";
    process.env.CLOUDFLARE_CDN_BASE_URL = "https://cdn-first.example.com";

    expect(serverEnv.cloudflareCdnBaseUrl).toBe("https://cdn-first.example.com");
  });

  test("reports R2 config availability correctly", () => {
    expect(serverEnv.isCloudflareR2UploadConfigured).toBe(false);

    process.env.CLOUDFLARE_R2_ACCOUNT_ID = "acc";
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
    process.env.CLOUDFLARE_R2_BUCKET_NAME = "bucket";

    expect(serverEnv.isCloudflareR2UploadConfigured).toBe(true);
  });
});
