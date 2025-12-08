import { setEmojiStatus } from "@telegram-apps/sdk";

import { isInMiniApp } from ".";

const canSetEmojiStatus = (): boolean => {
  if (!isInMiniApp()) return false;
  return setEmojiStatus.isSupported();
};

export const setUserEmojiStatus = async (emojiId: string): Promise<boolean> => {
  if (!canSetEmojiStatus()) return false;
  try {
    return await setEmojiStatus(emojiId);
  } catch (error) {
    console.error("Failed to set emoji status", error);
    return false;
  }
};
