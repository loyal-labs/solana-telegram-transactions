import "server-only";

import {
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";

import { joinObjectPaths } from "./object-path";

const REQUIRED_R2_ENV_VARS = [
  "CLOUDFLARE_R2_ACCOUNT_ID",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_BUCKET_NAME",
] as const;

type RequiredR2EnvVar = (typeof REQUIRED_R2_ENV_VARS)[number];

export type CloudflareR2UploadClientConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint?: string;
  uploadPrefix?: string;
};

export type R2UploadImageInput = {
  key: string;
  body: NonNullable<PutObjectCommandInput["Body"]>;
  contentType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
};

export type R2UploadResult = {
  key: string;
  bucket: string;
  etag?: string;
  versionId?: string;
};

export type CloudflareR2UploadClient = {
  uploadImage: (input: R2UploadImageInput) => Promise<R2UploadResult>;
};

let uploadClientFromEnv: CloudflareR2UploadClient | null = null;

function getRequiredEnv(name: RequiredR2EnvVar): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function createS3Client(config: CloudflareR2UploadClientConfig): S3Client {
  return new S3Client({
    region: "auto",
    endpoint:
      config.endpoint ??
      `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Ensures requests target the account endpoint format documented by Cloudflare.
    forcePathStyle: true,
  });
}

export function isCloudflareR2UploadConfigured(): boolean {
  return REQUIRED_R2_ENV_VARS.every((name) => {
    const value = process.env[name];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function getCloudflareR2UploadClientConfigFromEnv(): CloudflareR2UploadClientConfig {
  return {
    accountId: getRequiredEnv("CLOUDFLARE_R2_ACCOUNT_ID"),
    accessKeyId: getRequiredEnv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
    secretAccessKey: getRequiredEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    bucketName: getRequiredEnv("CLOUDFLARE_R2_BUCKET_NAME"),
    endpoint: process.env.CLOUDFLARE_R2_S3_ENDPOINT?.trim() || undefined,
    uploadPrefix: process.env.CLOUDFLARE_R2_UPLOAD_PREFIX?.trim() || undefined,
  };
}

export function createCloudflareR2UploadClient(
  config: CloudflareR2UploadClientConfig
): CloudflareR2UploadClient {
  const s3Client = createS3Client(config);

  const uploadImage = async (
    input: R2UploadImageInput
  ): Promise<R2UploadResult> => {
    const key = joinObjectPaths(
      config.uploadPrefix,
      input.key,
      "R2 object key"
    );

    const response = await s3Client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl:
          input.cacheControl ?? "public, max-age=31536000, immutable",
        Metadata: input.metadata,
      })
    );

    return {
      key,
      bucket: config.bucketName,
      etag: response.ETag,
      versionId: response.VersionId,
    };
  };

  return { uploadImage };
}

export function getCloudflareR2UploadClientFromEnv(): CloudflareR2UploadClient {
  if (uploadClientFromEnv) {
    return uploadClientFromEnv;
  }

  uploadClientFromEnv = createCloudflareR2UploadClient(
    getCloudflareR2UploadClientConfigFromEnv()
  );

  return uploadClientFromEnv;
}
