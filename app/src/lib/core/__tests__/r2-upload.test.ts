import { type PutObjectCommandInput, S3Client } from "@aws-sdk/client-s3";
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

const R2_ENV_KEYS = [
  "CLOUDFLARE_R2_ACCOUNT_ID",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_BUCKET_NAME",
  "CLOUDFLARE_R2_S3_ENDPOINT",
  "CLOUDFLARE_R2_UPLOAD_PREFIX",
] as const;

const originalSend = S3Client.prototype.send;
let createCloudflareR2UploadClient: (
  config: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    endpoint?: string;
    uploadPrefix?: string;
  }
) => {
  uploadImage: (input: {
    key: string;
    body: NonNullable<PutObjectCommandInput["Body"]>;
    contentType: string;
    cacheControl?: string;
    metadata?: Record<string, string>;
  }) => Promise<{
    key: string;
    bucket: string;
    etag?: string;
    versionId?: string;
  }>;
};
let getCloudflareR2UploadClientConfigFromEnv: () => {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string;
  uploadPrefix?: string;
};
let isCloudflareR2UploadConfigured: () => boolean;

function clearR2Env(): void {
  for (const key of R2_ENV_KEYS) {
    delete process.env[key];
  }
}

describe("r2-upload", () => {
  beforeAll(async () => {
    const loadedModule = await import("../r2-upload");
    createCloudflareR2UploadClient = loadedModule.createCloudflareR2UploadClient;
    getCloudflareR2UploadClientConfigFromEnv =
      loadedModule.getCloudflareR2UploadClientConfigFromEnv;
    isCloudflareR2UploadConfigured =
      loadedModule.isCloudflareR2UploadConfigured;
  });

  beforeEach(() => {
    clearR2Env();
    S3Client.prototype.send = originalSend;
  });

  afterEach(() => {
    clearR2Env();
    S3Client.prototype.send = originalSend;
  });

  test("reports R2 config availability correctly", () => {
    expect(isCloudflareR2UploadConfigured()).toBe(false);

    process.env.CLOUDFLARE_R2_ACCOUNT_ID = "acc";
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
    process.env.CLOUDFLARE_R2_BUCKET_NAME = "bucket";

    expect(isCloudflareR2UploadConfigured()).toBe(true);
  });

  test("reads upload client config from env", () => {
    process.env.CLOUDFLARE_R2_ACCOUNT_ID = "acc";
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
    process.env.CLOUDFLARE_R2_BUCKET_NAME = "bucket";
    process.env.CLOUDFLARE_R2_S3_ENDPOINT = "https://r2.example.com";
    process.env.CLOUDFLARE_R2_UPLOAD_PREFIX = "telegram/photos";

    expect(getCloudflareR2UploadClientConfigFromEnv()).toEqual({
      accountId: "acc",
      accessKeyId: "key",
      secretAccessKey: "secret",
      bucketName: "bucket",
      endpoint: "https://r2.example.com",
      uploadPrefix: "telegram/photos",
    });
  });

  test("throws when required env var is missing", () => {
    process.env.CLOUDFLARE_R2_ACCOUNT_ID = "acc";
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";

    expect(() => getCloudflareR2UploadClientConfigFromEnv()).toThrow(
      "CLOUDFLARE_R2_BUCKET_NAME is not set"
    );
  });

  test("uploads an image with normalized key and default cache policy", async () => {
    let commandInput: PutObjectCommandInput | undefined;

    S3Client.prototype.send = (async (command: { input: PutObjectCommandInput }) => {
      commandInput = command.input;
      return { ETag: '"etag-1"', VersionId: "ver-1" };
    }) as S3Client["send"];

    const client = createCloudflareR2UploadClient({
      accountId: "acc",
      accessKeyId: "key",
      secretAccessKey: "secret",
      bucketName: "bucket",
      uploadPrefix: "telegram/photos/",
    });

    const result = await client.uploadImage({
      key: "/group-1//avatar #1.png",
      body: Buffer.from("image-bytes"),
      contentType: "image/png",
    });

    expect(commandInput).toMatchObject({
      Bucket: "bucket",
      Key: "telegram/photos/group-1/avatar #1.png",
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    });

    expect(result).toEqual({
      key: "telegram/photos/group-1/avatar #1.png",
      bucket: "bucket",
      etag: '"etag-1"',
      versionId: "ver-1",
    });
  });

  test("rejects unsafe object keys before sending request", async () => {
    let called = false;

    S3Client.prototype.send = (async () => {
      called = true;
      return {};
    }) as S3Client["send"];

    const client = createCloudflareR2UploadClient({
      accountId: "acc",
      accessKeyId: "key",
      secretAccessKey: "secret",
      bucketName: "bucket",
      uploadPrefix: "telegram/photos",
    });

    await expect(
      client.uploadImage({
        key: "group/../avatar.png",
        body: Buffer.from("image-bytes"),
        contentType: "image/png",
      })
    ).rejects.toThrow("R2 object key contains an invalid path segment");

    expect(called).toBe(false);
  });
});
