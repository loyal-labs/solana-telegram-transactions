import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

const createClientCalls: Array<Record<string, unknown>> = [];
const identifyCalls: string[] = [];
const setUserProfileCalls: Array<Record<string, unknown>> = [];
const resetCalls: Array<undefined> = [];
const trackCalls: Array<{ event: string; properties?: Record<string, unknown> }> = [];

mock.module("@loyal-labs/shared/analytics", () => ({
  createMixpanelBrowserClient: (config: Record<string, unknown>) => {
    createClientCalls.push(config);
    return {
      init: async () => {},
      track: (event: string, properties?: Record<string, unknown>) => {
        trackCalls.push({ event, properties });
      },
      identify: (distinctId: string) => {
        identifyCalls.push(distinctId);
      },
      reset: () => {
        resetCalls.push(undefined);
      },
      setContext: () => {},
      clearContext: () => {},
      setUserProfile: (properties: Record<string, unknown>) => {
        setUserProfileCalls.push(properties);
      },
      setUserProfileOnce: () => {},
      __resetForTests: () => {},
    };
  },
}));

let analytics: typeof import("../analytics");

const publicEnv = {
  appEnvironment: "prod",
  turnstile: {
    mode: "widget",
    siteKey: "site-key",
  },
  gridAuthBaseUrl: "https://auth.askloyal.com",
  solanaEnv: "devnet",
  solanaRpcEndpoint: "https://rpc.example",
  swap: {
    mode: "disabled",
    reason: "missing",
  },
  skillsEnabled: true,
  demoRecipeEnabled: false,
  mixpanelToken: "frontend-mixpanel-token",
  mixpanelProxyPath: "/ingest",
  gitBranch: "feature-branch",
  gitCommitHash: "abc1234",
} as const;

describe("frontend analytics adapter", () => {
  beforeAll(async () => {
    analytics = await import("../analytics");
  });

  beforeEach(() => {
    (globalThis as { window?: unknown }).window = {
      location: { origin: "https://askloyal.com" },
    };
    createClientCalls.length = 0;
    identifyCalls.length = 0;
    setUserProfileCalls.length = 0;
    resetCalls.length = 0;
    trackCalls.length = 0;
    analytics.__resetAnalyticsStateForTests();
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  test("creates the client with stable frontend register properties", async () => {
    await analytics.initAnalytics(publicEnv);

    expect(createClientCalls).toEqual([
      {
        token: "frontend-mixpanel-token",
        apiHost: "https://askloyal.com/ingest",
        debug: false,
        persistence: "localStorage",
        registerProperties: {
          app_environment: "prod",
          app_solana_env: "devnet",
          git_branch: "feature-branch",
          git_commit_hash: "abc1234",
          workspace: "frontend",
        },
      },
    ]);
  });

  test("tracks page views with path properties", () => {
    analytics.trackPageView(publicEnv, "/wallet");

    expect(trackCalls).toEqual([
      {
        event: "View /wallet",
        properties: {
          path: "/wallet",
        },
      },
    ]);
  });

  test("identifies authenticated users with grid distinct ids and profile fields", () => {
    analytics.identifyAuthenticatedUser(publicEnv, {
      authMethod: "wallet",
      subjectAddress: "subject-address",
      displayAddress: "display-address",
      gridUserId: "grid-user-1",
      provider: "privy",
      email: "user@example.com",
      walletAddress: "wallet-address",
      smartAccountAddress: "smart-account-address",
    });

    expect(identifyCalls).toEqual(["grid:grid-user-1"]);
    expect(setUserProfileCalls).toEqual([
      {
        grid_user_id: "grid-user-1",
        auth_method: "wallet",
        provider: "privy",
        email: "user@example.com",
        $email: "user@example.com",
        display_address: "display-address",
        wallet_address: "wallet-address",
        smart_account_address: "smart-account-address",
      },
    ]);
  });

  test("does not identify users without a grid user id", () => {
    analytics.identifyAuthenticatedUser(publicEnv, {
      authMethod: "wallet",
      subjectAddress: "subject-address",
      displayAddress: "display-address",
    });

    expect(identifyCalls).toHaveLength(0);
    expect(setUserProfileCalls).toHaveLength(0);
  });

  test("refreshes the profile when tracked auth fields change", () => {
    analytics.identifyAuthenticatedUser(publicEnv, {
      authMethod: "wallet",
      subjectAddress: "subject-address",
      displayAddress: "display-address",
      gridUserId: "grid-user-1",
    });
    analytics.identifyAuthenticatedUser(publicEnv, {
      authMethod: "wallet",
      subjectAddress: "subject-address",
      displayAddress: "display-address",
      gridUserId: "grid-user-1",
      email: "user@example.com",
    });

    expect(identifyCalls).toEqual(["grid:grid-user-1"]);
    expect(setUserProfileCalls).toHaveLength(2);
    expect(setUserProfileCalls[1]).toMatchObject({
      email: "user@example.com",
      $email: "user@example.com",
    });
  });

  test("resets the identified user on logout", () => {
    analytics.identifyAuthenticatedUser(publicEnv, {
      authMethod: "wallet",
      subjectAddress: "subject-address",
      displayAddress: "display-address",
      gridUserId: "grid-user-1",
    });

    analytics.resetAuthenticatedUser();

    expect(resetCalls).toHaveLength(1);

    analytics.identifyAuthenticatedUser(publicEnv, {
      authMethod: "wallet",
      subjectAddress: "subject-address",
      displayAddress: "display-address",
      gridUserId: "grid-user-1",
    });

    expect(identifyCalls).toEqual(["grid:grid-user-1", "grid:grid-user-1"]);
  });
});
