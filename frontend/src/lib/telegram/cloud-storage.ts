import { cloudStorage } from "@telegram-apps/sdk";

import { CloudKeyInput } from "@/types/telegram";

import { isInMiniApp } from "./index";

const normalizeKeys = (input: CloudKeyInput): string[] =>
  Array.isArray(input) ? input : [input];

const canUseCloudStorage = (): boolean => {
  if (!isInMiniApp()) return false;

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
  if (!canUseCloudStorage()) return false;
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
  if (!canUseCloudStorage()) return null;
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
  if (!canUseCloudStorage()) return false;
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
