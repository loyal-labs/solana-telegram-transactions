// ---- constants & helpers ----
const AES_GCM = "AES-GCM";
const AES_GCM_IV_BYTES = 12; // 96-bit nonce recommended for GCM
const AES_GCM_TAG_BITS = 128; // 16-byte tag (WebCrypto appends tag to ciphertext)
const AES_256_KEY_BYTES = 32;

const enc = new TextEncoder();
const dec = new TextDecoder();

const toArrayBuffer = (data: ArrayBuffer | Uint8Array): ArrayBuffer => {
  if (data instanceof ArrayBuffer) return data;
  const { buffer, byteOffset, byteLength } = data;
  // Reuse the underlying buffer if it's already an ArrayBuffer and fully spans it
  if (
    buffer instanceof ArrayBuffer &&
    byteOffset === 0 &&
    byteLength === buffer.byteLength
  ) {
    return buffer;
  }
  // Otherwise copy the exact view slice into a fresh ArrayBuffer (not SharedArrayBuffer)
  return buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer;
};

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle)
    throw new Error(
      "WebCrypto SubtleCrypto is unavailable in this environment."
    );
  return subtle;
}

function getRandomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  globalThis.crypto.getRandomValues(out);
  return out;
}

// Base64url (nicer for JSON/URLs)
const b64uEncode = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

const b64uDecode = (s: string): Uint8Array => {
  const pad =
    s.length % 4 === 2
      ? "=="
      : s.length % 4 === 3
        ? "="
        : s.length % 4 === 1
          ? "==="
          : "";
  const bin = atob(s.replaceAll("-", "+").replaceAll("_", "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

// ---- key import & zeroization ----
export async function importDekKey(dek: Uint8Array): Promise<CryptoKey> {
  if (dek.byteLength !== AES_256_KEY_BYTES) {
    throw new Error(`Invalid DEK length: expected ${AES_256_KEY_BYTES} bytes.`);
  }
  return await getSubtle().importKey(
    "raw",
    toArrayBuffer(dek),
    { name: AES_GCM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Best-effort zeroize a Uint8Array (JS can’t guarantee, but it helps)
export function zeroize(bytes: Uint8Array) {
  bytes.fill(0);
}

// ---- AAD normalization (WebCrypto expects ArrayBuffer) ----
function asBufferSource(u8?: Uint8Array): ArrayBuffer | undefined {
  if (!u8) return;
  return u8.buffer.slice(
    u8.byteOffset,
    u8.byteOffset + u8.byteLength
  ) as ArrayBuffer;
}

// ---- API types ----
export type EncryptedPayload = {
  iv: Uint8Array; // 12 bytes
  ciphertext: Uint8Array; // ciphertext || 16-byte GCM tag (appended)
};

// Optional JSON-safe wrapper
export type EncryptedB64 = {
  iv_b64u: string;
  ct_b64u: string;
};

// ---- core encrypt/decrypt ----
export async function encryptWithDek(
  dek: Uint8Array,
  data: Uint8Array | ArrayBuffer | string,
  aad?: Uint8Array
): Promise<EncryptedPayload> {
  const key = await importDekKey(dek);
  const iv = getRandomBytes(AES_GCM_IV_BYTES);

  const bytes =
    typeof data === "string"
      ? enc.encode(data)
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : data;

  const params: AesGcmParams = {
    name: AES_GCM,
    iv: toArrayBuffer(iv),
    tagLength: AES_GCM_TAG_BITS,
  };
  if (aad) {
    params.additionalData = asBufferSource(aad);
  }

  const ctBuf = await getSubtle().encrypt(params, key, toArrayBuffer(bytes));

  return { iv, ciphertext: new Uint8Array(ctBuf) };
}

export async function decryptWithDek(
  dek: Uint8Array,
  payload: EncryptedPayload,
  aad?: Uint8Array
): Promise<Uint8Array> {
  const key = await importDekKey(dek);
  const params: AesGcmParams = {
    name: AES_GCM,
    iv: toArrayBuffer(payload.iv),
    tagLength: AES_GCM_TAG_BITS,
  };
  if (aad) {
    params.additionalData = asBufferSource(aad);
  }

  const ptBuf = await getSubtle().decrypt(
    params,
    key,
    toArrayBuffer(payload.ciphertext)
  );
  return new Uint8Array(ptBuf);
}

// ---- JSON helpers (nice for DB/APIs) ----
export function sealToB64(payload: EncryptedPayload): EncryptedB64 {
  return {
    iv_b64u: b64uEncode(payload.iv),
    ct_b64u: b64uEncode(payload.ciphertext),
  };
}

export function openFromB64(b: EncryptedB64): EncryptedPayload {
  return { iv: b64uDecode(b.iv_b64u), ciphertext: b64uDecode(b.ct_b64u) };
}

// ---- JSON value helpers ----
export async function encryptJsonWithDek<T>(
  dek: Uint8Array,
  value: T,
  aad?: Uint8Array
) {
  const raw = enc.encode(JSON.stringify(value));
  return await encryptWithDek(dek, raw, aad);
}

export async function decryptJsonWithDek<T>(
  dek: Uint8Array,
  payload: EncryptedPayload,
  aad?: Uint8Array
): Promise<T> {
  const raw = await decryptWithDek(dek, payload, aad);
  return JSON.parse(dec.decode(raw)) as T;
}

export function hexToU8(hex: string): Uint8Array {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length % 2) throw new Error("bad hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = Number.parseInt(hex.slice(2 * i, 2 * i + 2), 16);
  return out;
}

export function generateCmk(length = 32): Uint8Array {
  if (length < 16) throw new Error("CMK must be at least 16 bytes.");
  const cmk = new Uint8Array(length);
  globalThis.crypto.getRandomValues(cmk);
  return cmk;
}

export async function deriveDekFromCmk(
  cmk: Uint8Array, // IKM, e.g. 32 random bytes
  txId32: Uint8Array // exactly 32 bytes (same as c.tx_id.to_bytes())
): Promise<Uint8Array> {
  if (txId32.byteLength !== 32) throw new Error("tx_id must be 32 bytes.");
  const subtle = getSubtle();

  // Import CMK as HKDF base key
  const baseKey = await subtle.importKey(
    "raw",
    toArrayBuffer(cmk),
    "HKDF",
    false, // non-extractable
    ["deriveBits"]
  );

  // Build `info = "file:" || tx_id`
  const filePrefix = new TextEncoder().encode("file:"); // 5 bytes
  const info = new Uint8Array(5 + 32);
  info.set(filePrefix, 0);
  info.set(txId32, 5);

  // salt=nil -> pass empty Uint8Array (RFC5869: treated as zeros)
  const salt = new Uint8Array(0);

  // Derive 256 bits (32 bytes)
  const bits = await subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      info: toArrayBuffer(info),
    },
    baseKey,
    256
  );

  return new Uint8Array(bits); // 32-byte DEK
}
