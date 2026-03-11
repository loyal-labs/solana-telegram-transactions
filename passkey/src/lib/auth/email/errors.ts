import type { GridError } from "@sqds/grid";

export class EmailAuthError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    message: string,
    options: {
      code: string;
      status: number;
      details?: unknown;
    }
  ) {
    super(message);
    this.name = "EmailAuthError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

type GridErrorDetails = Array<{
  message?: string;
  field?: string;
  code?: string;
}> | undefined;

export function asGridError(error: unknown): GridError | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "GridError"
  ) {
    return error as GridError;
  }

  return null;
}

export function getGridErrorMessages(error: GridError | null): string[] {
  if (!error || !Array.isArray(error.details)) {
    return [];
  }

  return (error.details as GridErrorDetails)
    ?.map((detail) => detail?.message)
    .filter((message): message is string => typeof message === "string") ?? [];
}

export function shouldFallbackToSignIn(error: unknown): boolean {
  const gridError = asGridError(error);
  if (!gridError) {
    return false;
  }

  if (gridError.statusCode === 409) {
    return true;
  }

  const haystack = [gridError.message, ...getGridErrorMessages(gridError)]
    .join(" ")
    .toLowerCase();

  return (
    haystack.includes("already exists") ||
    haystack.includes("already registered") ||
    haystack.includes("account exists")
  );
}

export function mapBeginEmailAuthError(error: unknown): never {
  if (error instanceof EmailAuthError) {
    throw error;
  }

  const gridError = asGridError(error);
  if (gridError) {
    if (gridError.statusCode === 429) {
      throw new EmailAuthError(
        "Too many verification attempts. Please try again later.",
        {
          code: "rate_limited",
          status: 429,
          details: gridError.details,
        }
      );
    }

    if (
      gridError.statusCode &&
      gridError.statusCode >= 400 &&
      gridError.statusCode < 500
    ) {
      throw new EmailAuthError(gridError.message, {
        code: "invalid_request",
        status: gridError.statusCode,
        details: gridError.details,
      });
    }
  }

  throw new EmailAuthError(
    error instanceof Error
      ? error.message
      : "Failed to start email authentication",
    {
      code: "email_auth_start_failed",
      status: 502,
    }
  );
}

export function mapCompleteEmailAuthError(error: unknown): never {
  if (error instanceof EmailAuthError) {
    throw error;
  }

  const gridError = asGridError(error);
  if (gridError) {
    if (gridError.statusCode === 429) {
      throw new EmailAuthError(
        "Too many verification attempts. Please try again later.",
        {
          code: "rate_limited",
          status: 429,
          details: gridError.details,
        }
      );
    }

    if (
      gridError.statusCode === 400 ||
      gridError.statusCode === 401 ||
      gridError.statusCode === 403
    ) {
      throw new EmailAuthError("The verification code is invalid or expired.", {
        code: "invalid_otp",
        status: 401,
        details: gridError.details,
      });
    }
  }

  throw new EmailAuthError(
    error instanceof Error
      ? error.message
      : "Failed to verify email authentication",
    {
      code: "email_auth_verify_failed",
      status: 502,
    }
  );
}
