import { initCusper } from "@metaplex-foundation/cusper";
import type { ErrorWithLogs } from "@metaplex-foundation/cusper";
export * from "../../generated/errors/index.js";
import { errorFromCode } from "../../generated/index.js";

const cusper = initCusper(errorFromCode);

export function translateAndThrowAnchorError(err: unknown): never {
  if (!isErrorWithLogs(err)) {
    throw err;
  }

  const translatedError = cusper.errorFromProgramLogs(err.logs) ?? err;

  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(translatedError, translateAndThrowAnchorError);
  }

  (translatedError as unknown as ErrorWithLogs).logs = err.logs;

  throw translatedError;
}

export const isErrorWithLogs = (err: unknown): err is ErrorWithLogs => {
  return Boolean(
    err && typeof err === "object" && "logs" in err && Array.isArray(err.logs)
  );
};
