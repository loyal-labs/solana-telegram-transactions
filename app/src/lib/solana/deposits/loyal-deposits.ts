import {
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  LoyalPrivateTransactionsClient,
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
} from "@vladarbatov/private-transactions-test";

import { getConnection } from "../rpc/connection";
import { getWalletKeypair } from "../wallet/wallet-details";
import { closeWsolAta, wrapSolToWSol } from "./wsol-utils";

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
        deposits.set(mint, Number(deposit.amount));
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
    console.log("initializeDeposit");
    const initializeDepositSig = await client.initializeDeposit({
      tokenMint,
      user: keypair.publicKey,
      payer: keypair.publicKey,
    });
    console.log("initializeDepositSig", initializeDepositSig);
  }

  // 2. Wrap native SOL → wSOL if needed
  const isNativeSol = tokenMint.equals(NATIVE_MINT);
  const connection = getConnection();
  let createdAta = false;

  if (isNativeSol) {
    const result = await wrapSolToWSol({
      connection,
      payer: keypair,
      lamports: amount,
    });
    createdAta = result.createdAta;
  }

  const userTokenAccount = getAssociatedTokenAddressSync(
    tokenMint,
    keypair.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );
  console.log("userTokenAccount", userTokenAccount.toString());

  // 3. Move tokens into the deposit vault
  console.log("modifyBalance");
  const { signature } = await client.modifyBalance({
    tokenMint,
    amount,
    increase: true,
    user: keypair.publicKey,
    payer: keypair.publicKey,
    userTokenAccount,
  });
  console.log("modifyBalance sig", signature);

  // Close temporary wSOL ATA if we created it
  if (isNativeSol && createdAta) {
    await closeWsolAta({
      connection,
      payer: keypair,
      wsolAta: userTokenAccount,
    });
  }

  // 4. Create permission (may already exist)
  try {
    await client.createPermission({
      tokenMint,
      user: keypair.publicKey,
      payer: keypair.publicKey,
    });
  } catch {
    // Permission may already exist, that's fine
  }

  // 5. Delegate deposit to PER
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
  const connection = getConnection();
  const isNativeSol = tokenMint.equals(NATIVE_MINT);

  // Ensure wSOL ATA exists for native SOL withdrawals
  if (isNativeSol) {
    await wrapSolToWSol({ connection, payer: keypair, lamports: 0 });
  }

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

  // 3. Unwrap wSOL back to native SOL
  if (isNativeSol) {
    await closeWsolAta({
      connection,
      payer: keypair,
      wsolAta: userTokenAccount,
    });
  }

  return signature;
}
