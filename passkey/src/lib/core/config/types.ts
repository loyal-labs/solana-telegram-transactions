export type PasskeyGridEnvironment = "sandbox" | "production";

export type PasskeyServerConfig = {
  gridEnvironment: PasskeyGridEnvironment;
  customDomainBaseUrl: string;
  gridApiBaseUrl: string;
  appName: string;
  gridApiKey?: string;
};
