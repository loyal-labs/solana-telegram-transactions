import { isStrictTrue, normalizeOptionalValue } from "./shared";

export type PublicSolanaEnv = "mainnet" | "testnet" | "devnet" | "localnet";

const DEFAULT_SOLANA_ENV: PublicSolanaEnv = "devnet";
const DEFAULT_MIXPANEL_PROXY_PATH = "/ingest";

const PUBLIC_SOLANA_ENV_VALUES: readonly PublicSolanaEnv[] = [
  "mainnet",
  "testnet",
  "devnet",
  "localnet",
];

const isPublicSolanaEnv = (value: string): value is PublicSolanaEnv =>
  PUBLIC_SOLANA_ENV_VALUES.includes(value as PublicSolanaEnv);

export const publicEnv = {
  get serverHost(): string | undefined {
    return normalizeOptionalValue(process.env.NEXT_PUBLIC_SERVER_HOST);
  },
  get telegramBotId(): string {
    return normalizeOptionalValue(process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID) ?? "";
  },
  get solanaEnv(): PublicSolanaEnv {
    const value = normalizeOptionalValue(process.env.NEXT_PUBLIC_SOLANA_ENV);
    return value && isPublicSolanaEnv(value) ? value : DEFAULT_SOLANA_ENV;
  },
  get gasPublicKey(): string | undefined {
    return normalizeOptionalValue(process.env.NEXT_PUBLIC_GAS_PUBLIC_KEY);
  },
  get useMockSummaries(): boolean {
    return isStrictTrue(
      normalizeOptionalValue(process.env.NEXT_PUBLIC_USE_MOCK_SUMMARIES)
    );
  },
  get mixpanelToken(): string | undefined {
    return normalizeOptionalValue(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN);
  },
  get mixpanelProxyPath(): string {
    const value = normalizeOptionalValue(
      process.env.NEXT_PUBLIC_MIXPANEL_PROXY_PATH
    );

    if (!value) {
      return DEFAULT_MIXPANEL_PROXY_PATH;
    }

    return value.startsWith("/") ? value : `/${value}`;
  },
} as const;
