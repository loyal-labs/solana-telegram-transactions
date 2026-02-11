import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

import type { EncryptedData } from "../types";

mock.module("server-only", () => ({}));

let encrypt: (plaintext: string) => Promise<EncryptedData | null>;
let decrypt: (encrypted: EncryptedData) => Promise<string | null>;

const TEST_KEY = "0fegoicH8L0zl6r5Xn7v2y7e8UAhDOyxwWtBTQXWT/A=";

describe("encryption integration", () => {
  beforeAll(async () => {
    const loadedModule = await import("../index");
    encrypt = loadedModule.encrypt;
    decrypt = loadedModule.decrypt;
  });

  beforeEach(() => {
    process.env.MESSAGE_ENCRYPTION_KEY = TEST_KEY;
  });

  test("full roundtrip with various message types", async () => {
    const messages = [
      "Simple text",
      "With numbers 12345",
      "Special chars !@#$%^&*()",
      "Newlines\nand\ttabs",
      "Unicode: 你好世界 🎉",
      JSON.stringify({ key: "value", nested: { data: [1, 2, 3] } }),
      " leading and trailing spaces ",
      "x", // single character
    ];

    for (const original of messages) {
      const encrypted = await encrypt(original);
      expect(encrypted).not.toBeNull();

      const decrypted = await decrypt(encrypted!);
      expect(decrypted).toBe(original);
    }
  });

  test("encrypted data can be serialized and deserialized", async () => {
    const original = "test message";
    const encrypted = await encrypt(original);
    expect(encrypted).not.toBeNull();

    // Simulate storage/transmission
    const serialized = JSON.stringify(encrypted);
    const deserialized: EncryptedData = JSON.parse(serialized);

    const decrypted = await decrypt(deserialized);
    expect(decrypted).toBe(original);
  });

  test("multiple encryptions produce unique outputs", async () => {
    const message = "same message";
    const results: EncryptedData[] = [];

    for (let i = 0; i < 10; i++) {
      const encrypted = await encrypt(message);
      expect(encrypted).not.toBeNull();
      results.push(encrypted!);
    }

    // All IVs should be unique
    const ivs = results.map((r) => r.iv);
    const uniqueIvs = new Set(ivs);
    expect(uniqueIvs.size).toBe(10);

    // All ciphertexts should be unique (due to different IVs)
    const ciphertexts = results.map((r) => r.ciphertext);
    const uniqueCiphertexts = new Set(ciphertexts);
    expect(uniqueCiphertexts.size).toBe(10);

    // But all should decrypt to the same message
    for (const encrypted of results) {
      const decrypted = await decrypt(encrypted);
      expect(decrypted).toBe(message);
    }
  });

  test("concurrent encryption/decryption operations", async () => {
    const messages = Array.from({ length: 50 }, (_, i) => `Message ${i}`);

    const encryptPromises = messages.map((m) => encrypt(m));
    const encrypted = await Promise.all(encryptPromises);

    expect(encrypted.every((e) => e !== null)).toBe(true);

    const decryptPromises = encrypted.map((e) => decrypt(e!));
    const decrypted = await Promise.all(decryptPromises);

    expect(decrypted).toEqual(messages);
  });

  test("exports are correctly structured", () => {
    expect(typeof encrypt).toBe("function");
    expect(typeof decrypt).toBe("function");
  });
});
