"use client";

import type MixpanelType from "mixpanel-browser";

import { publicEnv } from "@/lib/core/config/public";
import type {
  TelegramIdentity,
  TelegramLaunchContext,
} from "@/lib/telegram/mini-app/init-data-transform";
import { parseSummaryFeedStartParam } from "@/lib/telegram/mini-app/start-param";

type AnalyticsProperties = Record<string, unknown>;

let mixpanel: typeof MixpanelType | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;
let lastIdentifiedDistinctId: string | null = null;
let lastProfiledDistinctId: string | null = null;
let lastRegisteredDistinctId: string | null = null;
let lastRegisteredUsername: string | null = null;
let currentLaunchContext: AnalyticsProperties = {};

const TELEGRAM_IDENTITY_PROVIDER = "telegram" as const;

function normalizeOptionalString(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isClientEnvironment(): boolean {
  return typeof window !== "undefined";
}

function canTrack(): boolean {
  return isClientEnvironment() && Boolean(publicEnv.mixpanelToken);
}

function getApiHost(): string {
  return `${window.location.origin}${publicEnv.mixpanelProxyPath}`;
}

async function loadMixpanel(): Promise<typeof MixpanelType | null> {
  if (mixpanel) return mixpanel;
  try {
    const mod = await import("mixpanel-browser");
    mixpanel = mod.default;
    return mixpanel;
  } catch (error) {
    console.error("Failed to load Mixpanel", error);
    return null;
  }
}

export function initAnalytics(): Promise<void> {
  if (!canTrack() || isInitialized) {
    return Promise.resolve();
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    const mp = await loadMixpanel();
    if (!mp) return;

    const isDevnetDemoMode = publicEnv.solanaEnv === "devnet";

    try {
      mp.init(publicEnv.mixpanelToken!, {
        api_host: getApiHost(),
        debug: isDevnetDemoMode,
        track_pageview: false,
        persistence: "localStorage",
      });

      if (isDevnetDemoMode) {
        mp.register({
          app_mode: "demo",
          app_solana_env: "devnet",
        });
      }

      isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Mixpanel", error);
      initPromise = null;
    }
  })();

  return initPromise;
}

function setUserProfileOnce(properties: AnalyticsProperties): void {
  if (!mixpanel) return;
  try {
    mixpanel.people.set_once(properties);
  } catch (error) {
    console.error("Failed to set Mixpanel profile once", error);
  }
}

function mapLaunchContextToEventProperties(
  context: TelegramLaunchContext
): AnalyticsProperties {
  const startParamRaw = normalizeOptionalString(context.startParamRaw) ?? "none";
  const parsedStartParam = parseSummaryFeedStartParam(context.startParamRaw);

  return {
    start_param_raw: startParamRaw,
    group_chat_id: parsedStartParam?.groupChatId ?? "none",
    summary_id: parsedStartParam?.summaryId ?? "none",
  };
}

export function setTelegramLaunchContext(
  context: TelegramLaunchContext | null
): void {
  currentLaunchContext = mapLaunchContextToEventProperties(context ?? {});
}

export function clearTelegramLaunchContext(): void {
  currentLaunchContext = {};
}

export function track(event: string, properties?: AnalyticsProperties): void {
  if (!canTrack()) {
    return;
  }

  // Fire-and-forget: ensure initialized then track
  void initAnalytics().then(() => {
    if (!isInitialized || !mixpanel) return;

    try {
      mixpanel.track(event, {
        ...currentLaunchContext,
        ...(properties ?? {}),
      });
    } catch (error) {
      console.error("Failed to track Mixpanel event", error);
    }
  });
}

export function identifyTelegramUser(identity: TelegramIdentity | null): void {
  if (!identity || !canTrack()) {
    return;
  }

  void initAnalytics().then(() => {
    if (!isInitialized || !mixpanel) return;

    const distinctId = `tg:${identity.telegramId}`;
    const username = normalizeOptionalString(identity.username);
    const canSkipCompletely =
      lastIdentifiedDistinctId === distinctId &&
      lastProfiledDistinctId === distinctId &&
      lastRegisteredDistinctId === distinctId &&
      lastRegisteredUsername === username;

    if (canSkipCompletely) {
      return;
    }

    try {
      const currentDistinctId = mixpanel.get_distinct_id();
      if (
        lastIdentifiedDistinctId !== distinctId &&
        currentDistinctId !== distinctId
      ) {
        mixpanel.identify(distinctId);
      }

      mixpanel.register_once({
        telegram_id: identity.telegramId,
        identity_provider: TELEGRAM_IDENTITY_PROVIDER,
      });

      if (username) {
        mixpanel.register({
          telegram_username: username,
        });
      }

      if (lastProfiledDistinctId !== distinctId) {
        const profileProperties: AnalyticsProperties = {
          telegram_id: identity.telegramId,
          identity_provider: TELEGRAM_IDENTITY_PROVIDER,
        };

        if (username) {
          profileProperties.$username = username;
          profileProperties.telegram_username = username;
        }
        if (identity.firstName) {
          profileProperties.$first_name = identity.firstName;
        }
        if (identity.lastName) {
          profileProperties.$last_name = identity.lastName;
        }
        if (identity.photoUrl) {
          profileProperties.$avatar = identity.photoUrl;
        }
        if (identity.languageCode) {
          profileProperties.$language = identity.languageCode;
          profileProperties.telegram_language_code = identity.languageCode;
        }
        if (identity.isPremium !== undefined) {
          profileProperties.telegram_is_premium = identity.isPremium;
        }

        setUserProfileOnce(profileProperties);
        lastProfiledDistinctId = distinctId;
      }

      lastIdentifiedDistinctId = distinctId;
      lastRegisteredDistinctId = distinctId;
      lastRegisteredUsername = username;
    } catch (error) {
      console.error("Failed to identify Telegram Mixpanel user", error);
    }
  });
}

export function identify(distinctId: string): void {
  if (!canTrack()) {
    return;
  }

  void initAnalytics().then(() => {
    if (!isInitialized || !mixpanel) return;

    try {
      mixpanel.identify(distinctId);
    } catch (error) {
      console.error("Failed to identify Mixpanel user", error);
    }
  });
}

export function resetAnalytics(): void {
  if (!canTrack()) {
    return;
  }

  void initAnalytics().then(() => {
    if (!isInitialized || !mixpanel) return;

    try {
      mixpanel.reset();
    } catch (error) {
      console.error("Failed to reset Mixpanel user", error);
    }
  });
}

export function setUserProfile(properties: AnalyticsProperties): void {
  if (!canTrack()) {
    return;
  }

  void initAnalytics().then(() => {
    if (!isInitialized || !mixpanel) return;

    try {
      mixpanel.people.set(properties);
    } catch (error) {
      console.error("Failed to set Mixpanel profile", error);
    }
  });
}

export function __resetAnalyticsStateForTests(): void {
  isInitialized = false;
  initPromise = null;
  mixpanel = null;
  lastIdentifiedDistinctId = null;
  lastProfiledDistinctId = null;
  lastRegisteredDistinctId = null;
  lastRegisteredUsername = null;
  currentLaunchContext = {};
}
