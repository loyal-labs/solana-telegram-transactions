import { beforeEach, describe, expect, test } from "bun:test";

import { encrypt } from "../encrypt";

const TEST_KEY = "0fegoicH8L0zl6r5Xn7v2y7e8UAhDOyxwWtBTQXWT/A=";

describe("encrypt", () => {
  beforeEach(() => {
    process.env.MESSAGE_ENCRYPTION_KEY = TEST_KEY;
  });

  test("encrypts a string and returns EncryptedData", async () => {
    const result = await encrypt("hello world");

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("ciphertext");
    expect(result).toHaveProperty("iv");
    expect(typeof result!.ciphertext).toBe("string");
    expect(typeof result!.iv).toBe("string");
  });

  test("generates different IVs for each encryption", async () => {
    const result1 = await encrypt("same message");
    const result2 = await encrypt("same message");

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result1!.iv).not.toBe(result2!.iv);
    expect(result1!.ciphertext).not.toBe(result2!.ciphertext);
  });

  test("encrypts empty string", async () => {
    const result = await encrypt("");

    expect(result).not.toBeNull();
    expect(result!.ciphertext).toBeTruthy();
    expect(result!.iv).toBeTruthy();
  });

  test("encrypts unicode characters", async () => {
    const result = await encrypt("Hello 👋 World 🌍 日本語");

    expect(result).not.toBeNull();
    expect(result!.ciphertext).toBeTruthy();
  });

  test("encrypts long messages", async () => {
    const longMessage = "a".repeat(10000);
    const result = await encrypt(longMessage);

    expect(result).not.toBeNull();
    expect(result!.ciphertext).toBeTruthy();
  });

  test("returns null when key is not set", async () => {
    delete process.env.MESSAGE_ENCRYPTION_KEY;

    const result = await encrypt("test");

    expect(result).toBeNull();
  });

  test("returns null when key is invalid length", async () => {
    process.env.MESSAGE_ENCRYPTION_KEY = "dG9vc2hvcnQ="; // "tooshort" base64

    const result = await encrypt("test");

    expect(result).toBeNull();
  });

  test("returns null when key is not valid base64", async () => {
    process.env.MESSAGE_ENCRYPTION_KEY = "not-valid-base64!!!";

    const result = await encrypt("test");

    expect(result).toBeNull();
  });

  test("ciphertext is valid base64", async () => {
    const result = await encrypt("test message");

    expect(result).not.toBeNull();
    expect(() => Buffer.from(result!.ciphertext, "base64")).not.toThrow();
    expect(() => Buffer.from(result!.iv, "base64")).not.toThrow();
  });

  test("IV is 12 bytes when decoded", async () => {
    const result = await encrypt("test");

    expect(result).not.toBeNull();
    const ivBytes = Buffer.from(result!.iv, "base64");
    expect(ivBytes.length).toBe(12);
  });
});
