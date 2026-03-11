export type PasskeyHostResolutionOptions = {
  allowedParentDomain: string;
  allowLocalhost: boolean;
  rpId: string;
};

export type ResolvedPasskeyHostContext = {
  hostname: string;
  origin: string;
  rpId: string;
  isLocalhost: boolean;
};

export class PasskeyHostResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasskeyHostResolutionError";
  }
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().replace(/\.$/, "").toLowerCase();
}

function getPrimaryHeaderValue(headers: Headers, name: string): string | null {
  const value = headers.get(name);
  if (!value) {
    return null;
  }

  const primary = value.split(",")[0]?.trim();
  return primary && primary.length > 0 ? primary : null;
}

export function resolvePasskeyHostContext(
  hostname: string,
  options: PasskeyHostResolutionOptions
): Omit<ResolvedPasskeyHostContext, "origin"> {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedParentDomain = normalizeHostname(options.allowedParentDomain);
  const normalizedRpId = normalizeHostname(options.rpId);

  if (!normalizedHostname) {
    throw new PasskeyHostResolutionError("Passkey hostname is required");
  }

  if (normalizedHostname === "localhost") {
    if (!options.allowLocalhost) {
      throw new PasskeyHostResolutionError("Localhost is not allowed for passkeys");
    }

    return {
      hostname: normalizedHostname,
      rpId: "localhost",
      isLocalhost: true,
    };
  }

  if (
    normalizedHostname === normalizedParentDomain ||
    normalizedHostname.endsWith(`.${normalizedParentDomain}`)
  ) {
    return {
      hostname: normalizedHostname,
      rpId: normalizedRpId,
      isLocalhost: false,
    };
  }

  throw new PasskeyHostResolutionError(
    `Host "${normalizedHostname}" is not allowed for passkeys`
  );
}

export function resolvePasskeyRequestContext(args: {
  requestUrl: string;
  headers: Headers;
  options: PasskeyHostResolutionOptions;
}): ResolvedPasskeyHostContext {
  const fallbackUrl = new URL(args.requestUrl);
  const hostHeader =
    getPrimaryHeaderValue(args.headers, "x-forwarded-host") ??
    getPrimaryHeaderValue(args.headers, "host") ??
    fallbackUrl.host;
  const protocol =
    getPrimaryHeaderValue(args.headers, "x-forwarded-proto") ??
    fallbackUrl.protocol.replace(/:$/, "");
  const resolvedUrl = new URL(`${protocol}://${hostHeader}`);
  const resolvedHost = resolvePasskeyHostContext(
    resolvedUrl.hostname,
    args.options
  );

  return {
    ...resolvedHost,
    origin: resolvedUrl.origin,
  };
}

export function resolveCurrentPasskeyBrowserContext(
  locationLike: Pick<Location, "hostname" | "origin"> = window.location
): ResolvedPasskeyHostContext {
  const rpId = process.env.NEXT_PUBLIC_GRID_RP_ID;

  if (!rpId?.trim()) {
    throw new PasskeyHostResolutionError(
      "NEXT_PUBLIC_GRID_RP_ID is required for passkey flows"
    );
  }

  const resolvedHost = resolvePasskeyHostContext(locationLike.hostname, {
    allowedParentDomain: rpId,
    allowLocalhost: true,
    rpId,
  });

  return {
    ...resolvedHost,
    origin: locationLike.origin,
  };
}
