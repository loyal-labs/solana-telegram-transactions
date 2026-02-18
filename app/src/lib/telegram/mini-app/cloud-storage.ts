import { CloudKeyInput } from "@/types/telegram";

const normalizeKeys = (input: CloudKeyInput): string[] =>
  Array.isArray(input) ? input : [input];

type TelegramCloudStorage = (typeof import("@telegram-apps/sdk"))["cloudStorage"];
type TelegramSdkModule = typeof import("@telegram-apps/sdk");

let sdkInitialized = false;

const getCloudStorage = async (): Promise<TelegramCloudStorage | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const sdk = await import("@telegram-apps/sdk");
    await ensureSdkInitialized(sdk);
    return sdk.cloudStorage;
  } catch (error) {
    console.error("Failed to load Telegram cloud storage SDK", error);
    return null;
  }
};

const ensureSdkInitialized = async (sdk: TelegramSdkModule): Promise<void> => {
  if (sdkInitialized) return;

  try {
    sdk.init();
  } catch {
    // SDK may already be initialized or unavailable in non-Telegram contexts.
  } finally {
    sdkInitialized = true;
  }
};

const canUseCloudStorage = (cloudStorage: TelegramCloudStorage): boolean => {
  try {
    return cloudStorage.isSupported();
  } catch (error) {
    console.error("Failed to check cloud storage support", error);
    return false;
  }
};

const hasKeys = (keys: string[]): boolean => {
  if (keys.length > 0) return true;

  console.error("Cloud storage operation requires at least one key");
  return false;
};

export async function setCloudValue(
  key: string,
  value: string
): Promise<boolean> {
  const cloudStorage = await getCloudStorage();
  if (!cloudStorage) return false;
  if (!canUseCloudStorage(cloudStorage)) return false;
  if (!cloudStorage.setItem.isAvailable()) return false;

  if (!hasKeys([key])) return false;

  try {
    await cloudStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error("Failed to set cloud storage value", error);
    return false;
  }
}

export async function getCloudValue(
  keyOrKeys: CloudKeyInput
): Promise<string | Record<string, string> | null> {
  const cloudStorage = await getCloudStorage();
  if (!cloudStorage) return null;
  if (!canUseCloudStorage(cloudStorage)) return null;
  if (!cloudStorage.getItem.isAvailable()) return null;

  const keys = normalizeKeys(keyOrKeys);
  if (!hasKeys(keys)) return null;

  try {
    if (typeof keyOrKeys === "string") {
      return await cloudStorage.getItem(keyOrKeys);
    }

    return await cloudStorage.getItem(keyOrKeys);
  } catch (error) {
    console.error("Failed to get cloud storage value", error);
    return null;
  }
}

export async function deleteCloudValue(
  keyOrKeys: CloudKeyInput
): Promise<boolean> {
  const cloudStorage = await getCloudStorage();
  if (!cloudStorage) return false;
  if (!canUseCloudStorage(cloudStorage)) return false;
  if (!cloudStorage.deleteItem.isAvailable()) return false;

  const keys = normalizeKeys(keyOrKeys);
  if (!hasKeys(keys)) return false;

  try {
    await cloudStorage.deleteItem(keyOrKeys);
    return true;
  } catch (error) {
    console.error("Failed to delete cloud storage value", error);
    return false;
  }
}
