export type PasskeyGridEnvironment = "sandbox" | "production";

export type PasskeyServerConfig = {
  gridEnvironment: PasskeyGridEnvironment;
  allowedParentDomain: string;
  allowLocalhost: boolean;
  rpId: string;
  gridApiBaseUrl: string;
  appName: string;
  gridApiKey?: string;
  authJwtSecret: string;
  authJwtTtlSeconds: number;
};
