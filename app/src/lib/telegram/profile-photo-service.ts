import { createHash } from "node:crypto";

import { getCloudflareCdnBaseUrlFromEnv, getCloudflareCdnUrlClientFromEnv } from "@/lib/core/cdn-url";
import {
  getCloudflareR2UploadClientFromEnv,
  isCloudflareR2UploadConfigured,
} from "@/lib/core/r2-upload";
import { getBot } from "@/lib/telegram/bot-api/bot";
import { downloadTelegramFile } from "@/lib/telegram/bot-api/get-file";

const PROFILE_CAPTURE_TIMEOUT_MS = 2500;

type CaptureProfilePhotoOptions = {
  timeoutMs?: number;
};

function hashTelegramId(telegramId: bigint): string {
  return createHash("sha256").update(String(telegramId), "utf8").digest("hex");
}

function resolveExtensionFromContentType(contentType: string): string {
  const normalized = contentType.split(";")[0]?.trim().toLowerCase();

  switch (normalized) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/jpeg":
    case "image/jpg":
    default:
      return "jpg";
  }
}

export function resolveAvatarObjectKey(
  telegramId: bigint,
  contentType: string
): string {
  const telegramIdHash = hashTelegramId(telegramId);
  const extension = resolveExtensionFromContentType(contentType);
  return `telegram/users/${telegramIdHash}/profile.${extension}`;
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Telegram profile photo capture timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function captureTelegramProfilePhotoToCdnInternal(
  telegramId: bigint
): Promise<string | null> {
  if (!isCloudflareR2UploadConfigured() || !getCloudflareCdnBaseUrlFromEnv()) {
    return null;
  }

  const userIdAsNumber = Number(telegramId);
  if (!Number.isSafeInteger(userIdAsNumber)) {
    return null;
  }

  const bot = await getBot();
  const profilePhotos = await bot.api.getUserProfilePhotos(userIdAsNumber, {
    limit: 1,
  });
  const firstPhoto = profilePhotos.photos[0]?.[0];

  if (!firstPhoto?.file_id) {
    return null;
  }

  const photoFile = await downloadTelegramFile(firstPhoto.file_id);
  const key = resolveAvatarObjectKey(telegramId, photoFile.contentType);

  await getCloudflareR2UploadClientFromEnv().uploadImage({
    key,
    body: photoFile.body,
    contentType: photoFile.contentType,
  });

  return getCloudflareCdnUrlClientFromEnv().resolveUrl({ key });
}

export async function captureTelegramProfilePhotoToCdn(
  telegramId: bigint,
  options?: CaptureProfilePhotoOptions
): Promise<string | null> {
  const timeoutMs = options?.timeoutMs ?? PROFILE_CAPTURE_TIMEOUT_MS;

  try {
    return await withTimeout(
      captureTelegramProfilePhotoToCdnInternal(telegramId),
      timeoutMs
    );
  } catch (error) {
    console.warn("Failed to capture Telegram profile photo", {
      telegramId: String(telegramId),
      error,
    });
    return null;
  }
}
