import Mixpanel from "mixpanel";

import { serverEnv } from "@/lib/core/config/server";

type MixpanelTrackPrimitive = boolean | null | number | string;
type TrackingIdentifier = bigint | number | string;

export type MixpanelTrackProperties = Record<string, MixpanelTrackPrimitive>;

type BotTrackingInput = {
  chatId?: TrackingIdentifier | null;
  chatType?: string | null;
  userId?: TrackingIdentifier | null;
};

function normalizeIdentifier(
  value: TrackingIdentifier | null | undefined
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toString();
}

function resolveDistinctId(input: BotTrackingInput): string {
  const telegramUserId = normalizeIdentifier(input.userId);
  if (telegramUserId) {
    return `tg:${telegramUserId}`;
  }

  const telegramChatId = normalizeIdentifier(input.chatId);
  if (telegramChatId) {
    return `tg-chat:${telegramChatId}`;
  }

  return "tg:unknown";
}

export function createBotTrackingProperties(
  input: BotTrackingInput
): MixpanelTrackProperties {
  return {
    distinct_id: resolveDistinctId(input),
    telegram_chat_id: normalizeIdentifier(input.chatId),
    telegram_chat_type: input.chatType ?? null,
    telegram_user_id: normalizeIdentifier(input.userId),
  };
}

export function trackBotEvent(
  eventName: string,
  properties: MixpanelTrackProperties
): void {
  const token = serverEnv.mixpanelToken;
  if (!token) {
    return;
  }

  try {
    const mixpanel = Mixpanel.init(token);
    mixpanel.track(eventName, properties, (error: unknown) => {
      if (error) {
        console.error(`Failed to track Mixpanel event: ${eventName}`, error);
      }
    });
  } catch (error) {
    console.error(`Failed to track Mixpanel event: ${eventName}`, error);
  }
}
