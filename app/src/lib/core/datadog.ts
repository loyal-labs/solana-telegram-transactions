import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { reactPlugin } from "@datadog/browser-rum-react";

import { publicEnv } from "@/lib/core/config/public";
import type { TelegramIdentity } from "@/lib/telegram/mini-app/init-data-transform";

function getDatadogEnv(): string {
  const branch = publicEnv.gitBranch;
  if (branch === "main") return "prod";
  if (branch === "dev") return "dev";
  return "preview";
}

// Shared config — RUM and Logs SDKs must agree on session-related
// options so they share the same _dd_s cookie for correlation.
const sharedConfig = {
  clientToken: "pub65e82b493fbf5faa4c3847345e32e609",
  site: "us5.datadoghq.com",
  service: "app-frontend",
  env: getDatadogEnv(),
  version: publicEnv.gitCommitHash,
} as const;

let initialized = false;

export function initDatadog() {
  if (initialized) return;
  initialized = true;

  datadogRum.init({
    ...sharedConfig,
    applicationId: "67ad7dc6-b0d4-4ef4-9dec-3ded01bf7a9a",
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    trackErrors: true,
    defaultPrivacyLevel: "mask-user-input",
    plugins: [reactPlugin({ router: false })],
  });

  datadogLogs.init({
    ...sharedConfig,
    sessionSampleRate: 100,
    forwardErrorsToLogs: true,
    forwardConsoleLogs: ["warn", "error"],
    forwardReports: "all",
  });
}

export function identifyDatadogUser(identity: TelegramIdentity): void {
  datadogRum.setUser({
    id: identity.telegramId,
    name: identity.username ?? identity.firstName,
    telegramUsername: identity.username,
    isPremium: identity.isPremium,
  });
}
