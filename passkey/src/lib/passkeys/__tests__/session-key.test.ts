import { describe, expect, test } from "bun:test";
import bs58 from "bs58";

import {
  toSessionKeyObject,
  toSessionKeyBackendObject,
} from "@/lib/passkeys/session-key";

describe("session-key helpers", () => {
  test("converts base58 session key into Grid session key object", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const encoded = bs58.encode(Uint8Array.from(original));
    const sessionKey = toSessionKeyObject(encoded, 123);
    expect(sessionKey).toEqual({
      key: original,
      expiration: 123,
    });
  });

  test("produces backend session key object with absolute expiration", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const encoded = bs58.encode(Uint8Array.from(original));
    const sessionKey = toSessionKeyBackendObject(encoded, 900);
    expect(sessionKey.key.length).toBe(8);
    expect(sessionKey.expiration).toBe(900);
  });
});
