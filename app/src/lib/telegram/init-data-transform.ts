import { etc, verify } from "@noble/ed25519";
import qs from "qs";

import { TELEGRAM_BOT_ID, TELEGRAM_PUBLIC_KEYS } from "../constants";

export const cleanInitData = (initData: string) => {
  const cleanInitData = qs.parse(initData);
  // sort the object by keys
  const sortedInitData = Object.keys(cleanInitData)
    .sort()
    .reduce((obj: Record<string, unknown>, key: string) => {
      obj[key] = cleanInitData[key as keyof typeof cleanInitData];
      return obj;
    }, {});
  return sortedInitData;
};

export const createValidationString = (
  botId: string,
  data: Record<string, unknown>
) => {
  const filteredEntries = Object.entries(data).filter(
    ([key]) => key !== "hash" && key !== "signature"
  );

  const formattedLines = filteredEntries.map(([key, value]) => {
    if (typeof value === "string") {
      return `${key}=${value}`;
    }
    if (typeof value === "number" || typeof value === "bigint") {
      return `${key}=${value.toString()}`;
    }
    if (typeof value === "boolean") {
      return `${key}=${value ? "true" : "false"}`;
    }
    if (value === null || value === undefined) {
      return `${key}=`;
    }
    return `${key}=${JSON.stringify(value)}`;
  });

  const validationString = [`${botId}:WebAppData`, ...formattedLines].join(
    "\n"
  );

  return validationString;
};

const decodeBase64 = (value: string): Uint8Array => {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/\s/g, "");
  const remainder = normalized.length % 4;
  const padded =
    remainder === 0 ? normalized : normalized + "=".repeat(4 - remainder);

  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(padded, "base64"));
  }

  throw new Error("Base64 decoding is not supported in this environment");
};

const parseSignature = (signature: string): Uint8Array => {
  const trimmed = signature.trim();
  const hexPattern = /^[0-9a-fA-F]+$/;

  if (hexPattern.test(trimmed) && trimmed.length % 2 === 0) {
    return etc.hexToBytes(trimmed);
  }

  return decodeBase64(trimmed);
};

export const validateInitData = (
  validationString: string,
  signature: string
) => {
  try {
    const message = new TextEncoder().encode(validationString);
    const signatureBytes = parseSignature(signature);
    // show all entries in message as array of bytes
    console.log(Array.from(message));
    console.log(Array.from(signatureBytes));
    if (signatureBytes.length !== 64) {
      console.error("Invalid signature length");
      return false;
    }

    return TELEGRAM_PUBLIC_KEYS.some((publicKeyHex) => {
      const publicKeyBytes = etc.hexToBytes(publicKeyHex);
      if (publicKeyBytes.length !== 32) {
        console.error("Invalid public key length");
        return false;
      }
      return verify(signatureBytes, message, publicKeyBytes);
    });
  } catch (error) {
    console.error("Failed to validate Telegram init data", error);
    return false;
  }
};

export const createValidationBytesFromRawInitData = (
  rawInitData: string
): { validationBytes: Uint8Array; signatureBytes: Uint8Array } => {
  const cleanData = cleanInitData(rawInitData);
  const validationString = createValidationString(TELEGRAM_BOT_ID, cleanData);
  const validationBytes = new TextEncoder().encode(validationString);
  const signatureBytes = parseSignature(cleanData.signature as string);

  return { validationBytes, signatureBytes };
};
