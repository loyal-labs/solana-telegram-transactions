import { LlmValidationError } from "./errors";

type ValidationSuccess<T> = {
  ok: true;
  value: T;
};

type ValidationFailure = {
  ok: false;
  reason: string;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validationSuccess<T>(value: T): ValidationSuccess<T> {
  return { ok: true, value };
}

export function validationFailure(reason: string): ValidationFailure {
  return { ok: false, reason };
}

export function assertValidationResult<T>(
  result: ValidationResult<T>,
  details?: Record<string, unknown>
): T {
  if (result.ok) {
    return result.value;
  }

  throw new LlmValidationError(result.reason, details);
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
