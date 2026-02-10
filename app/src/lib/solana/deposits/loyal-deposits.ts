import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  LoyalPrivateTransactionsClient,
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
} from "@vladarbatov/private-transactions-test";

import { getConnection } from "../rpc/connection";
import { getWalletKeypair } from "../wallet/wallet-details";

const PER_RPC_ENDPOINT = "https://tee.magicblock.app";
const PER_WS_ENDPOINT = "wss://tee.magicblock.app";

async function getBaseClient(): Promise<LoyalPrivateTransactionsClient> {
  const connection = getConnection();
  const keypair = await getWalletKeypair();
  return LoyalPrivateTransactionsClient.from(connection, keypair);
}

/**
 * Check which tokens have Loyal deposits. Returns a map of mint → deposit amount (raw).
 */
export async function fetchLoyalDeposits(
  userPublicKey: PublicKey,
  tokenMints: string[]
): Promise<Map<string, number>> {
  const client = await getBaseClient();
  const deposits = new Map<string, number>();

  const results = await Promise.allSettled(
    tokenMints.map(async (mint) => {
      const mintPubkey = new PublicKey(mint);
      const deposit = await client.getDeposit(userPublicKey, mintPubkey);
      if (deposit && deposit.amount > 0) {
        deposits.set(mint, deposit.amount);
      }
    })
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.warn("[loyal-deposits] Failed to check deposit:", result.reason);
    }
  }

  return deposits;
}

/**
 * Shield tokens: move from regular wallet into Loyal private deposit.
 * Flow: initializeDeposit (if needed) → modifyBalance(increase) → createPermission → delegateDeposit
 */
export async function shieldTokens(params: {
  tokenMint: PublicKey;
  amount: number;
}): Promise<string> {
  const keypair = await getWalletKeypair();
  const client = await getBaseClient();
  const { tokenMint, amount } = params;

  // 1. Initialize deposit if it doesn't exist yet
  const existingDeposit = await client.getDeposit(keypair.publicKey, tokenMint);
  if (!existingDeposit) {
    await client.initializeDeposit({
      tokenMint,
      user: keypair.publicKey,
      payer: keypair.publicKey,
    });
  }

  // 2. Move tokens into the deposit vault
  const userTokenAccount = getAssociatedTokenAddressSync(
    tokenMint,
    keypair.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const { signature } = await client.modifyBalance({
    tokenMint,
    amount,
    increase: true,
    user: keypair.publicKey,
    payer: keypair.publicKey,
    userTokenAccount,
  });

  // 3. Create permission (may already exist)
  try {
    await client.createPermission({
      tokenMint,
      user: keypair.publicKey,
      payer: keypair.publicKey,
    });
  } catch {
    // Permission may already exist, that's fine
  }

  // 4. Delegate deposit to PER
  try {
    await client.delegateDeposit({
      tokenMint,
      user: keypair.publicKey,
      payer: keypair.publicKey,
    });
  } catch {
    // May already be delegated
  }

  return signature;
}

/**
 * Unshield tokens: move from Loyal private deposit back to regular wallet.
 * Flow: undelegateDeposit (via PER) → modifyBalance(decrease) on base layer
 */
export async function unshieldTokens(params: {
  tokenMint: PublicKey;
  amount: number;
}): Promise<string> {
  const keypair = await getWalletKeypair();
  const { tokenMint, amount } = params;

  // 1. Undelegate from PER
  const perClient = await LoyalPrivateTransactionsClient.fromEphemeral({
    signer: keypair,
    rpcEndpoint: PER_RPC_ENDPOINT,
    wsEndpoint: PER_WS_ENDPOINT,
  });

  await perClient.undelegateDeposit({
    tokenMint,
    user: keypair.publicKey,
    payer: keypair.publicKey,
    magicProgram: MAGIC_PROGRAM_ID,
    magicContext: MAGIC_CONTEXT_ID,
  });

  // 2. Withdraw tokens back to regular wallet
  const baseClient = await getBaseClient();
  const userTokenAccount = getAssociatedTokenAddressSync(
    tokenMint,
    keypair.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  const { signature } = await baseClient.modifyBalance({
    tokenMint,
    amount,
    increase: false,
    user: keypair.publicKey,
    payer: keypair.publicKey,
    userTokenAccount,
  });

  return signature;
}
