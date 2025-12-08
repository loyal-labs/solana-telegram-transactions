import { shareMessage } from "@telegram-apps/sdk";

import { isInMiniApp } from ".";

const canShareMessage = (): boolean => {
  if (!isInMiniApp()) return false;
  return shareMessage.isSupported();
};

export const shareSavedInlineMessage = async (
  msgId: string
): Promise<boolean> => {
  if (!canShareMessage()) return false;
  try {
    await shareMessage(msgId);
    return true;
  } catch (error) {
    console.error("Failed to share message", error);
    return false;
  }
};
