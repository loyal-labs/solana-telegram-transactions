import "server-only";

import {
  getOptionalEnv,
  getRequiredEnv,
  type AppEnvironment,
  type EnvSource,
  resolveAppEnvironment,
} from "./shared";

export type { AppEnvironment } from "./shared";

const APP_ENVIRONMENT_ENV_NAME = "NEXT_PUBLIC_APP_ENVIRONMENT";

export type ChatRuntimeConfig = {
  apiKey: string;
  modelId: string | undefined;
};

export type ServerEnv = {
  appEnvironment: AppEnvironment;
  chatRuntime: ChatRuntimeConfig;
};

function createChatRuntimeConfig(env: EnvSource): ChatRuntimeConfig {
  return {
    apiKey: getRequiredEnv(env, "PHALA_API_KEY"),
    modelId: getOptionalEnv(env, "PHALA_MODEL_ID"),
  };
}

export function createServerEnv(env: EnvSource): ServerEnv {
  return {
    appEnvironment: resolveAppEnvironment(
      getOptionalEnv(env, APP_ENVIRONMENT_ENV_NAME)
    ),
    chatRuntime: createChatRuntimeConfig(env),
  };
}

export const serverEnv = createServerEnv(process.env);
