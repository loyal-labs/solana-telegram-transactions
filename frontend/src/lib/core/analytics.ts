"use client";

import type { AuthSessionUser } from "@loyal-labs/auth-core";
import {
  createMixpanelBrowserClient,
  type AnalyticsClient,
  type AnalyticsProperties,
} from "@loyal-labs/shared/analytics";

import type { PublicEnv } from "@/lib/core/config/public";

let analyticsClient: AnalyticsClient | null = null;
let analyticsClientKey: string | null = null;
let lastIdentifiedDistinctId: string | null = null;
let lastProfiledDistinctId: string | null = null;
let lastProfileFingerprint: string | null = null;

export function getFrontendPageViewEventName(pathname: string): string {
  return `View ${pathname}`;
}

function getApiHost(publicEnv: PublicEnv): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}${publicEnv.mixpanelProxyPath}`;
}

function getClientKey(publicEnv: PublicEnv): string {
  return JSON.stringify({
    token: publicEnv.mixpanelToken ?? null,
    proxyPath: publicEnv.mixpanelProxyPath,
    appEnvironment: publicEnv.appEnvironment,
    solanaEnv: publicEnv.solanaEnv,
    gitBranch: publicEnv.gitBranch,
    gitCommitHash: publicEnv.gitCommitHash,
  });
}

function getAnalyticsClient(publicEnv: PublicEnv): AnalyticsClient {
  const nextClientKey = getClientKey(publicEnv);

  if (analyticsClient && analyticsClientKey === nextClientKey) {
    return analyticsClient;
  }

  analyticsClientKey = nextClientKey;
  analyticsClient = createMixpanelBrowserClient({
    token: publicEnv.mixpanelToken,
    apiHost: getApiHost(publicEnv),
    debug: publicEnv.appEnvironment !== "prod",
    persistence: "localStorage",
    registerProperties: {
      app_environment: publicEnv.appEnvironment,
      app_solana_env: publicEnv.solanaEnv,
      git_branch: publicEnv.gitBranch,
      git_commit_hash: publicEnv.gitCommitHash,
      workspace: "frontend",
    },
  });

  return analyticsClient;
}

export function initAnalytics(publicEnv: PublicEnv): Promise<void> {
  return getAnalyticsClient(publicEnv).init();
}

export function track(
  publicEnv: PublicEnv,
  event: string,
  properties?: AnalyticsProperties
): void {
  getAnalyticsClient(publicEnv).track(event, properties);
}

export function trackPageView(publicEnv: PublicEnv, pathname: string): void {
  track(publicEnv, getFrontendPageViewEventName(pathname), { path: pathname });
}

function buildFrontendProfileProperties(user: AuthSessionUser): AnalyticsProperties {
  const profileProperties: AnalyticsProperties = {
    grid_user_id: user.gridUserId,
    auth_method: user.authMethod,
  };

  if (user.provider) {
    profileProperties.provider = user.provider;
  }
  if (user.email) {
    profileProperties.email = user.email;
    profileProperties.$email = user.email;
  }
  if (user.displayAddress) {
    profileProperties.display_address = user.displayAddress;
  }
  if (user.walletAddress) {
    profileProperties.wallet_address = user.walletAddress;
  }
  if (user.smartAccountAddress) {
    profileProperties.smart_account_address = user.smartAccountAddress;
  }

  return profileProperties;
}

function buildFrontendProfileFingerprint(user: AuthSessionUser): string {
  return JSON.stringify({
    gridUserId: user.gridUserId ?? null,
    authMethod: user.authMethod,
    provider: user.provider ?? null,
    email: user.email ?? null,
    displayAddress: user.displayAddress ?? null,
    walletAddress: user.walletAddress ?? null,
    smartAccountAddress: user.smartAccountAddress ?? null,
  });
}

export function identifyAuthenticatedUser(
  publicEnv: PublicEnv,
  user: AuthSessionUser | null
): void {
  if (!user?.gridUserId) {
    return;
  }

  const distinctId = `grid:${user.gridUserId}`;
  const client = getAnalyticsClient(publicEnv);
  const profileFingerprint = buildFrontendProfileFingerprint(user);

  if (lastIdentifiedDistinctId !== distinctId) {
    client.identify(distinctId);
    lastIdentifiedDistinctId = distinctId;
  }

  if (
    lastProfiledDistinctId !== distinctId ||
    lastProfileFingerprint !== profileFingerprint
  ) {
    client.setUserProfile(buildFrontendProfileProperties(user));
    lastProfiledDistinctId = distinctId;
    lastProfileFingerprint = profileFingerprint;
  }
}

export function resetAuthenticatedUser(): void {
  analyticsClient?.reset();
  lastIdentifiedDistinctId = null;
  lastProfiledDistinctId = null;
  lastProfileFingerprint = null;
}

export function __resetAnalyticsStateForTests(): void {
  analyticsClient?.__resetForTests();
  analyticsClient = null;
  analyticsClientKey = null;
  lastIdentifiedDistinctId = null;
  lastProfiledDistinctId = null;
  lastProfileFingerprint = null;
}
