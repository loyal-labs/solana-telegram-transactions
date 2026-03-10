"use client";

export type ApiOutcome = {
  ok: boolean;
  status: number;
  body: unknown;
};

export async function callPasskeyApi(
  endpoint: string,
  payload: unknown
): Promise<ApiOutcome> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  let body: unknown = bodyText;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  return { ok: response.ok, status: response.status, body };
}

export function extractPasskeyErrorMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "Passkey flow failed";
}

export function parsePasskeyErrorDetails(payload: unknown): string[] {
  const normalizeDetail = (detail: unknown): string | null => {
    if (typeof detail === "string") {
      return detail;
    }

    if (typeof detail === "object" && detail !== null) {
      const record = detail as Record<string, unknown>;
      const field = typeof record.field === "string" ? record.field : undefined;
      const code = typeof record.code === "string" ? record.code : undefined;
      const message =
        typeof record.message === "string" ? record.message : undefined;

      if (field && code && message) {
        return `${field} (${code}): ${message}`;
      }

      if (message) {
        return message;
      }
    }

    return null;
  };

  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "details" in payload.error &&
    Array.isArray(payload.error.details)
  ) {
    return payload.error.details
      .map(normalizeDetail)
      .filter((detail): detail is string => detail !== null);
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "details" in payload &&
    Array.isArray(payload.details)
  ) {
    return payload.details
      .map(normalizeDetail)
      .filter((detail): detail is string => detail !== null);
  }

  return [];
}

export function extractPasskeySessionUrl(payload: unknown): string | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "url" in payload &&
    typeof payload.url === "string"
  ) {
    return payload.url;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    typeof payload.data === "object" &&
    payload.data !== null &&
    "url" in payload.data &&
    typeof payload.data.url === "string"
  ) {
    return payload.data.url;
  }

  return null;
}

