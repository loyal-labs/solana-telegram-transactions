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

type UserProfilePhotos = {
  photos: { file_id: string }[][];
};

const uploadCalls: Array<{
  key: string;
  body: Buffer;
  contentType: string;
}> = [];
const resolveUrlCalls: string[] = [];
const profilePhotoCalls: number[] = [];
const downloadCalls: string[] = [];

let isR2Configured = true;
let hasCdnBaseUrl = true;
let profilePhotosImpl: (userId: number) => Promise<UserProfilePhotos> = async () => ({
  photos: [],
});
let downloadFileImpl: (fileId: string) => Promise<{ body: Buffer; contentType: string }> =
  async () => ({
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

mock.module("@/lib/telegram/bot-api/bot", () => ({
  getBot: async () => ({
    api: {
      getUserProfilePhotos: async (userId: number) => {
        profilePhotoCalls.push(userId);
        return profilePhotosImpl(userId);
      },
    },
  }),
}));

mock.module("@/lib/telegram/bot-api/get-file", () => ({
  downloadTelegramFile: async (fileId: string) => {
    downloadCalls.push(fileId);
    return downloadFileImpl(fileId);
  },
}));

let captureTelegramProfilePhotoToCdn: typeof import("../profile-photo-service").captureTelegramProfilePhotoToCdn;
let resolveAvatarObjectKey: typeof import("../profile-photo-service").resolveAvatarObjectKey;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("profile-photo-service", () => {
  beforeAll(async () => {
    const loaded = await import("../profile-photo-service");
    captureTelegramProfilePhotoToCdn = loaded.captureTelegramProfilePhotoToCdn;
    resolveAvatarObjectKey = loaded.resolveAvatarObjectKey;
  });

  beforeEach(() => {
    uploadCalls.length = 0;
    resolveUrlCalls.length = 0;
    profilePhotoCalls.length = 0;
    downloadCalls.length = 0;
    isR2Configured = true;
    hasCdnBaseUrl = true;
    profilePhotosImpl = async () => ({
      photos: [],
    });
    downloadFileImpl = async () => ({
      body: Buffer.from("img"),
      contentType: "image/jpeg",
    });
  });

  test("builds key from telegram ID hash", () => {
    const telegramId = BigInt("1234567890");
    const hash = createHash("sha256")
      .update(String(telegramId), "utf8")
      .digest("hex");

    expect(resolveAvatarObjectKey(telegramId, "image/png")).toBe(
      `telegram/users/${hash}/profile.png`
    );
  });

  test("uploads the first profile photo and returns CDN URL", async () => {
    const telegramId = BigInt("777");
    const hash = createHash("sha256")
      .update(String(telegramId), "utf8")
      .digest("hex");

    profilePhotosImpl = async () => ({
      photos: [[{ file_id: "file-1" }]],
    });
    downloadFileImpl = async () => ({
      body: Buffer.from("png-bytes"),
      contentType: "image/png",
    });

    const result = await captureTelegramProfilePhotoToCdn(telegramId);

    expect(result).toBe(
      `https://cdn.example.com/telegram/users/${hash}/profile.png`
    );
    expect(profilePhotoCalls).toEqual([777]);
    expect(downloadCalls).toEqual(["file-1"]);
    expect(uploadCalls).toHaveLength(1);
    expect(uploadCalls[0]?.key).toBe(`telegram/users/${hash}/profile.png`);
  });

  test("returns null when profile photo is missing", async () => {
    profilePhotosImpl = async () => ({
      photos: [],
    });

    const result = await captureTelegramProfilePhotoToCdn(BigInt("888"));

    expect(result).toBeNull();
    expect(uploadCalls).toHaveLength(0);
  });

  test("returns null when CDN/R2 config is missing", async () => {
    isR2Configured = false;
    hasCdnBaseUrl = false;

    const result = await captureTelegramProfilePhotoToCdn(BigInt("999"));

    expect(result).toBeNull();
    expect(profilePhotoCalls).toHaveLength(0);
    expect(uploadCalls).toHaveLength(0);
  });

  test("returns null when capture exceeds timeout", async () => {
    profilePhotosImpl = async () => {
      await sleep(20);
      return { photos: [[{ file_id: "file-2" }]] };
    };

    const result = await captureTelegramProfilePhotoToCdn(BigInt("1010"), {
      timeoutMs: 1,
    });

    expect(result).toBeNull();
    expect(uploadCalls).toHaveLength(0);
  });
});

