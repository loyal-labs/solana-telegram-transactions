import type { ErrorWithLogs } from "@metaplex-foundation/cusper";
export * from "../../generated/errors/index.js";
export declare function translateAndThrowAnchorError(err: unknown): never;
export declare const isErrorWithLogs: (err: unknown) => err is ErrorWithLogs;
