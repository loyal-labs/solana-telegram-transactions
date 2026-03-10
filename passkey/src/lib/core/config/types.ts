export type PasskeyGridEnvironment = "sandbox" | "production";

export type PasskeyServerConfig = {
  gridEnvironment: PasskeyGridEnvironment;
  allowedParentDomain: string;
  allowLocalhost: boolean;
  sharedRpId: string;
  gridApiBaseUrl: string;
  appName: string;
  gridApiKey?: string;
};
