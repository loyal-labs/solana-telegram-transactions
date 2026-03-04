import { createHash } from "node:crypto";

import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

mock.module("server-only", () => ({}));

const uploadCalls: Array<{
  key: string;
  body: Buffer;
  contentType: string;
}> = [];
const resolveUrlCalls: string[] = [];
const getChatCalls: Array<bigint | number | string> = [];
const downloadCalls: string[] = [];

let isR2Configured = true;
let hasCdnBaseUrl = true;
let getChatImpl: (chatId: bigint | number | string) => Promise<{
  photo?: { small_file_id?: string };
}> = async () => ({});
let downloadFileImpl: (fileId: string) => Promise<{
  body: Buffer;
  contentType: string;
}> = async () => ({
  body: Buffer.from("img"),
  contentType: "image/jpeg",
});

mock.module("@/lib/core/r2-upload", () => ({
  isCloudflareR2UploadConfigured: () => isR2Configured,
  getCloudflareR2UploadClientFromEnv: () => ({
    uploadImage: async (input: {
      key: string;
      body: Buffer;
      contentType: string;
    }) => {
      uploadCalls.push(input);
      return { key: input.key, bucket: "bucket" };
    },
  }),
}));

mock.module("@/lib/core/cdn-url", () => ({
  getCloudflareCdnBaseUrlFromEnv: () =>
    hasCdnBaseUrl ? "https://cdn.example.com" : null,
  getCloudflareCdnUrlClientFromEnv: () => ({
    resolveUrl: ({ key }: { key: string }) => {
      resolveUrlCalls.push(key);
      return `https://cdn.example.com/${key}`;
    },
  }),
}));

mock.module("@/lib/telegram/bot-api/get-chat", () => ({
  getChat: async (chatId: bigint | number | string) => {
    getChatCalls.push(chatId);
    return getChatImpl(chatId);
  },
}));

mock.module("@/lib/telegram/bot-api/get-file", () => ({
  downloadTelegramFile: async (fileId: string) => {
    downloadCalls.push(fileId);
    return downloadFileImpl(fileId);
  },
}));

let captureCommunityPhotoToCdn: typeof import("../community-photo-service").captureCommunityPhotoToCdn;
let resolveCommunityPhotoObjectKey: typeof import("../community-photo-service").resolveCommunityPhotoObjectKey;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("community-photo-service", () => {
  beforeAll(async () => {
    const loaded = await import("../community-photo-service");
    captureCommunityPhotoToCdn = loaded.captureCommunityPhotoToCdn;
    resolveCommunityPhotoObjectKey = loaded.resolveCommunityPhotoObjectKey;
  });

  beforeEach(() => {
    uploadCalls.length = 0;
    resolveUrlCalls.length = 0;
    getChatCalls.length = 0;
    downloadCalls.length = 0;
    isR2Configured = true;
    hasCdnBaseUrl = true;
    getChatImpl = async () => ({});
    downloadFileImpl = async () => ({
      body: Buffer.from("img"),
      contentType: "image/jpeg",
    });
  });

  test("builds key from chat ID hash", () => {
    const chatId = "-1001234567890";
    const hash = createHash("sha256").update(chatId, "utf8").digest("hex");

    expect(resolveCommunityPhotoObjectKey(chatId, "image/png")).toBe(
      `telegram/communities/${hash}/profile.png`
    );
  });

  test("uploads chat photo and returns CDN URL", async () => {
    const chatId = "-1009876543210";
    const hash = createHash("sha256").update(chatId, "utf8").digest("hex");

    getChatImpl = async () => ({
      photo: { small_file_id: "chat-photo-file-1" },
    });
    downloadFileImpl = async () => ({
      body: Buffer.from("png-bytes"),
      contentType: "image/png",
    });

    const result = await captureCommunityPhotoToCdn(chatId);

    expect(result).toBe(
      `https://cdn.example.com/telegram/communities/${hash}/profile.png`
    );
    expect(getChatCalls).toEqual([chatId]);
    expect(downloadCalls).toEqual(["chat-photo-file-1"]);
    expect(uploadCalls).toHaveLength(1);
    expect(uploadCalls[0]?.key).toBe(
      `telegram/communities/${hash}/profile.png`
    );
  });

  test("returns null when chat photo is missing", async () => {
    getChatImpl = async () => ({});

    const result = await captureCommunityPhotoToCdn("-10042");

    expect(result).toBeNull();
    expect(uploadCalls).toHaveLength(0);
  });

  test("returns null when CDN/R2 config is missing", async () => {
    isR2Configured = false;
    hasCdnBaseUrl = false;

    const result = await captureCommunityPhotoToCdn("-100777");

    expect(result).toBeNull();
    expect(getChatCalls).toHaveLength(0);
    expect(uploadCalls).toHaveLength(0);
  });

  test("returns null when capture exceeds timeout", async () => {
    getChatImpl = async () => {
      await sleep(20);
      return { photo: { small_file_id: "chat-photo-file-2" } };
    };

    const result = await captureCommunityPhotoToCdn("-1001010", {
      timeoutMs: 1,
    });

    expect(result).toBeNull();
    expect(uploadCalls).toHaveLength(0);
  });
});
