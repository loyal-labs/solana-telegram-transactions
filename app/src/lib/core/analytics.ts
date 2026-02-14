"use client";

import mixpanel from "mixpanel-browser";

import { publicEnv } from "@/lib/core/config/public";

type AnalyticsProperties = Record<string, unknown>;

let isInitialized = false;

function isClientEnvironment(): boolean {
  return typeof window !== "undefined";
}

function canTrack(): boolean {
  return isClientEnvironment() && Boolean(publicEnv.mixpanelToken);
}

function getApiHost(): string {
  return `${window.location.origin}${publicEnv.mixpanelProxyPath}`;
}

export function initAnalytics(): void {
  if (!canTrack() || isInitialized) {
    return;
  }

  const isDevnetDemoMode = publicEnv.solanaEnv === "devnet";

  try {
    mixpanel.init(publicEnv.mixpanelToken!, {
      api_host: getApiHost(),
      debug: isDevnetDemoMode,
      track_pageview: false,
      persistence: "localStorage",
    });

    if (isDevnetDemoMode) {
      mixpanel.register({
        app_mode: "demo",
        app_solana_env: "devnet",
      });
    }

    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize Mixpanel", error);
  }
}

export function track(event: string, properties?: AnalyticsProperties): void {
  if (!canTrack()) {
    return;
  }

  initAnalytics();
  if (!isInitialized) {
    return;
  }

  try {
    mixpanel.track(event, properties);
  } catch (error) {
    console.error("Failed to track Mixpanel event", error);
  }
}

export function identify(distinctId: string): void {
  if (!canTrack()) {
    return;
  }

  initAnalytics();
  if (!isInitialized) {
    return;
  }

  try {
    mixpanel.identify(distinctId);
  } catch (error) {
    console.error("Failed to identify Mixpanel user", error);
  }
}

export function resetAnalytics(): void {
  if (!canTrack()) {
    return;
  }

  initAnalytics();
  if (!isInitialized) {
    return;
  }

  try {
    mixpanel.reset();
  } catch (error) {
    console.error("Failed to reset Mixpanel user", error);
  }
}

export function setUserProfile(properties: AnalyticsProperties): void {
  if (!canTrack()) {
    return;
  }

  initAnalytics();
  if (!isInitialized) {
    return;
  }

  try {
    mixpanel.people.set(properties);
  } catch (error) {
    console.error("Failed to set Mixpanel profile", error);
  }
}
