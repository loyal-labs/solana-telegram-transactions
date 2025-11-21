import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import { ensureWalletKeypair } from "./wallet-keypair-logic";

const defaultEndpoint = clusterApiUrl("devnet");
const envEndpoint =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    : undefined;

const rpcEndpoint =
  envEndpoint && envEndpoint.length > 0 ? envEndpoint : defaultEndpoint;

let cachedConnection: Connection | null = null;

export const getConnection = (): Connection => {
  if (cachedConnection) return cachedConnection;

  cachedConnection = new Connection(rpcEndpoint, "confirmed");

  return cachedConnection;
};

let cachedWalletKeypair: Keypair | null = null;
let walletKeypairPromise: Promise<Keypair> | null = null;

const getWalletKeypair = async (): Promise<Keypair> => {
  if (cachedWalletKeypair) return cachedWalletKeypair;

  if (!walletKeypairPromise) {
    walletKeypairPromise = ensureWalletKeypair()
      .then(({ keypair }) => {
        cachedWalletKeypair = keypair;
        return keypair;
      })
      .finally(() => {
        walletKeypairPromise = null;
      });
  }

  return walletKeypairPromise;
};

export const getWalletPublicKey = async (): Promise<PublicKey> => {
  const keypair = await getWalletKeypair();
  return keypair.publicKey;
};

type CachedBalance = {
  lamports: number;
  fetchedAt: number;
};

const BALANCE_CACHE_TTL_MS = 10_000;

let balanceCache: CachedBalance | null = null;
let balancePromise: Promise<number> | null = null;

const shouldUseCachedBalance = (forceRefresh: boolean): boolean => {
  if (forceRefresh) return false;
  if (!balanceCache) return false;

  const age = Date.now() - balanceCache.fetchedAt;
  return age < BALANCE_CACHE_TTL_MS;
};

const setCachedBalance = (lamports: number) => {
  balanceCache = { lamports, fetchedAt: Date.now() };
};

export const getWalletBalance = async (
  forceRefresh = false
): Promise<number> => {
  if (shouldUseCachedBalance(forceRefresh)) {
    return balanceCache!.lamports;
  }

  if (!forceRefresh && balancePromise) {
    return balancePromise;
  }

  const loader = (async () => {
    const connection = getConnection();
    const keypair = await getWalletKeypair();

    const lamports = await connection.getBalance(
      keypair.publicKey,
      "confirmed"
    );
    setCachedBalance(lamports);

    return lamports;
  })();

  balancePromise = loader;

  try {
    return await loader;
  } finally {
    if (balancePromise === loader) {
      balancePromise = null;
    }
  }
};

const invalidateBalanceCache = () => {
  balanceCache = null;
  balancePromise = null;
};

export const sendSolTransaction = async (
  destination: string | PublicKey,
  lamports: number
): Promise<string> => {
  if (lamports <= 0) {
    throw new Error("Lamports must be greater than zero");
  }

  const connection = getConnection();
  const keypair = await getWalletKeypair();
  const toPubkey =
    typeof destination === "string" ? new PublicKey(destination) : destination;

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey,
      lamports,
    })
  );

  transaction.feePayer = keypair.publicKey;

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

  const signature = await connection.sendTransaction(transaction, [keypair], {
    skipPreflight: false,
  });

  await connection.confirmTransaction(
    {
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature,
    },
    "confirmed"
  );

  invalidateBalanceCache();

  return signature;
};
