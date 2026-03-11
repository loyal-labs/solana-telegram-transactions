export type AppEnvironment = "local" | "dev" | "prod";

export type EnvSource = Readonly<Record<string, string | undefined>>;

const APP_ENVIRONMENT_VALUES: readonly AppEnvironment[] = [
  "local",
  "dev",
  "prod",
];

export const DEFAULT_APP_ENVIRONMENT: AppEnvironment = "prod";

export function normalizeOptionalValue(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getOptionalEnv(
  env: EnvSource,
  name: string
): string | undefined {
  return normalizeOptionalValue(env[name]);
}

export function getRequiredEnv(env: EnvSource, name: string): string {
  const value = getOptionalEnv(env, name);
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function isStrictTrue(value: string | undefined): boolean {
  return value === "true";
}

export function isAppEnvironment(value: string): value is AppEnvironment {
  return APP_ENVIRONMENT_VALUES.includes(value as AppEnvironment);
}

export function resolveAppEnvironment(
  value: string | undefined
): AppEnvironment {
  const normalized = normalizeOptionalValue(value);
  return normalized && isAppEnvironment(normalized)
    ? normalized
    : DEFAULT_APP_ENVIRONMENT;
}
