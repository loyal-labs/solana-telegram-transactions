import { storage } from "#imports";
import { Keypair } from "@solana/web3.js";

// Store encrypted keypair in chrome.storage.local
const encryptedKeypair = storage.defineItem<string | null>("local:encryptedKeypair", {
  fallback: null,
});

const walletPublicKey = storage.defineItem<string | null>("local:walletPublicKey", {
  fallback: null,
});

export async function generateKeypair(password: string): Promise<Keypair> {
  const keypair = Keypair.generate();
  await storeKeypair(keypair, password);
  return keypair;
}

export async function importKeypair(secretKey: Uint8Array, password: string): Promise<Keypair> {
  const keypair = Keypair.fromSecretKey(secretKey);
  await storeKeypair(keypair, password);
  return keypair;
}

export async function loadKeypair(password: string): Promise<Keypair | null> {
  const encrypted = await encryptedKeypair.getValue();
  if (!encrypted) return null;
  const decrypted = await decrypt(encrypted, password);
  if (!decrypted) return null;
  return Keypair.fromSecretKey(new Uint8Array(JSON.parse(decrypted)));
}

export async function hasStoredKeypair(): Promise<boolean> {
  return (await encryptedKeypair.getValue()) !== null;
}

export async function getStoredPublicKey(): Promise<string | null> {
  return walletPublicKey.getValue();
}

async function storeKeypair(keypair: Keypair, password: string): Promise<void> {
  const serialized = JSON.stringify(Array.from(keypair.secretKey));
  const encrypted = await encrypt(serialized, password);
  await encryptedKeypair.setValue(encrypted);
  await walletPublicKey.setValue(keypair.publicKey.toBase58());
}

// AES-GCM encryption/decryption using Web Crypto API
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return JSON.stringify({
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  });
}

async function decrypt(ciphertext: string, password: string): Promise<string | null> {
  try {
    const { salt, iv, data } = JSON.parse(ciphertext);
    const key = await deriveKey(password, new Uint8Array(salt));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data),
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}
