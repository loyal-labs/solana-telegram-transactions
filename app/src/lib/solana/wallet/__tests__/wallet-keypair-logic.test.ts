import { Keypair } from "@solana/web3.js";
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

// --- Mock cloud-storage module ---

type GetCloudValueFn = (
  keys: string | string[]
) => Promise<string | Record<string, string> | null>;
type SetCloudValueFn = (key: string, value: string) => Promise<boolean>;
type DeleteCloudValueFn = (keys: string | string[]) => Promise<boolean>;

let getCloudValueImpl: GetCloudValueFn = async () => null;
let setCloudValueImpl: SetCloudValueFn = async () => true;
let deleteCloudValueImpl: DeleteCloudValueFn = async () => true;

let getCloudValueCalls: Array<string | string[]> = [];

mock.module("@/lib/telegram/mini-app/cloud-storage", () => ({
  getCloudValue: async (keys: string | string[]) => {
    getCloudValueCalls.push(keys);
    return getCloudValueImpl(keys);
  },
  setCloudValue: async (key: string, value: string) =>
    setCloudValueImpl(key, value),
  deleteCloudValue: async (keys: string | string[]) =>
    deleteCloudValueImpl(keys),
}));

let ensureWalletKeypair: typeof import("../wallet-keypair-logic").ensureWalletKeypair;
let CloudStorageUnavailableError: typeof import("../wallet-keypair-logic").CloudStorageUnavailableError;

beforeAll(async () => {
  const mod = await import("../wallet-keypair-logic");
  ensureWalletKeypair = mod.ensureWalletKeypair;
  CloudStorageUnavailableError = mod.CloudStorageUnavailableError;
});

beforeEach(() => {
  getCloudValueCalls = [];
  getCloudValueImpl = async () => null;
  setCloudValueImpl = async () => true;
  deleteCloudValueImpl = async () => true;
});

// Helper: create a stored keypair in cloud storage format
const makeStoredKeypair = () => {
  const kp = Keypair.generate();
  return {
    keypair: kp,
    stored: {
      solana_public_key: kp.publicKey.toBase58(),
      solana_secret_key: JSON.stringify(Array.from(kp.secretKey)),
    },
  };
};

describe("ensureWalletKeypair", () => {
  test("returns existing keypair when cloud storage has valid data", async () => {
    const { keypair, stored } = makeStoredKeypair();
    getCloudValueImpl = async () => stored;

    const result = await ensureWalletKeypair();

    expect(result.isNew).toBe(false);
    expect(result.keypair.publicKey.toBase58()).toBe(
      keypair.publicKey.toBase58()
    );
  });

  test("generates new keypair when cloud storage returns empty strings (new user)", async () => {
    getCloudValueImpl = async () => ({
      solana_public_key: "",
      solana_secret_key: "",
    });

    const result = await ensureWalletKeypair();

    expect(result.isNew).toBe(true);
    expect(result.keypair).toBeDefined();
  });

  test("retries when cloud storage returns null, then succeeds", async () => {
    const { keypair, stored } = makeStoredKeypair();
    let attempt = 0;
    getCloudValueImpl = async () => {
      attempt += 1;
      if (attempt <= 2) return null; // First 2 attempts fail
      return stored;
    };

    const result = await ensureWalletKeypair();

    expect(result.isNew).toBe(false);
    expect(result.keypair.publicKey.toBase58()).toBe(
      keypair.publicKey.toBase58()
    );
    expect(getCloudValueCalls.length).toBe(3);
  });

  test("throws CloudStorageUnavailableError after all retries return null", async () => {
    getCloudValueImpl = async () => null;

    expect(ensureWalletKeypair()).rejects.toThrow(CloudStorageUnavailableError);
  });

  test("retries when cloud storage throws, then succeeds", async () => {
    const { keypair, stored } = makeStoredKeypair();
    let attempt = 0;
    getCloudValueImpl = async () => {
      attempt += 1;
      if (attempt <= 1) throw new Error("SDK not ready");
      return stored;
    };

    const result = await ensureWalletKeypair();

    expect(result.isNew).toBe(false);
    expect(result.keypair.publicKey.toBase58()).toBe(
      keypair.publicKey.toBase58()
    );
  });

  test("throws CloudStorageUnavailableError after all retries throw", async () => {
    getCloudValueImpl = async () => {
      throw new Error("SDK not ready");
    };

    expect(ensureWalletKeypair()).rejects.toThrow(CloudStorageUnavailableError);
  });

  test("generates new keypair only when cloud storage returns empty strings on first attempt", async () => {
    // Empty strings on first try = genuinely new user (no retry needed)
    getCloudValueImpl = async () => ({
      solana_public_key: "",
      solana_secret_key: "",
    });

    const result = await ensureWalletKeypair();

    expect(result.isNew).toBe(true);
    // Should NOT have retried — empty strings are a definitive "not found"
    expect(getCloudValueCalls.length).toBe(1);
  });
});
