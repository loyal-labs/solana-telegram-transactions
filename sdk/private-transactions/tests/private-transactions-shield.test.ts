import { describe, it, expect, beforeAll } from "bun:test";
import {
  findDepositPda,
  LoyalPrivateTransactionsClient,
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
  PROGRAM_ID,
  ER_VALIDATOR,
} from "../index";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createMint,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  transfer,
} from "@solana/spl-token";

const PER_RPC_ENDPOINT = "https://tee.magicblock.app";
const PER_WS_ENDPOINT = "wss://tee.magicblock.app";

// const PER_RPC_ENDPOINT = "https://devnet-as.magicblock.app";
// const PER_WS_ENDPOINT = "wss://devnet-as.magicblock.app";

export const SECURE_DEVNET_RPC_URL =
  "https://aurora-o23cd4-fast-devnet.helius-rpc.com";
export const SECURE_DEVNET_RPC_WS =
  "wss://aurora-o23cd4-fast-devnet.helius-rpc.com";

const solanaConnection = new Connection(SECURE_DEVNET_RPC_URL, {
  wsEndpoint: SECURE_DEVNET_RPC_WS,
  commitment: "confirmed" as const,
});

// 4WRGdAZ8LHmbPC3CfdCR8sspKhBATs9EZ8H83RYJQ8RG
const USER_KP = Keypair.fromSecretKey(
  Uint8Array.from([
    54, 229, 115, 67, 69, 71, 205, 239, 251, 81, 102, 40, 48, 237, 241, 66, 8,
    22, 241, 216, 209, 140, 214, 111, 51, 58, 171, 169, 14, 90, 182, 255, 52,
    28, 88, 128, 77, 91, 157, 211, 179, 122, 209, 150, 17, 24, 121, 242, 177,
    212, 235, 216, 109, 5, 94, 31, 222, 100, 124, 166, 124, 52, 149, 131,
  ])
);
// 3cd5zjx8DAPDUciSrJtbrtniuNpDWhGLSKtk7xxCMCpP
const OTHER_USER_KP = Keypair.fromSecretKey(
  Uint8Array.from([
    112, 50, 255, 102, 148, 177, 8, 136, 48, 146, 49, 69, 16, 165, 113, 81, 123,
    225, 207, 149, 216, 229, 105, 50, 249, 48, 232, 27, 165, 181, 239, 97, 38,
    215, 129, 64, 75, 228, 54, 138, 179, 234, 24, 136, 233, 6, 252, 59, 233,
    186, 135, 194, 87, 255, 97, 59, 189, 140, 157, 56, 221, 35, 43, 56,
  ])
);

const USER = USER_KP.publicKey;
const OTHER_USER = OTHER_USER_KP.publicKey;

const loyalClient = await LoyalPrivateTransactionsClient.fromConfig({
  signer: USER_KP,
  baseRpcEndpoint: SECURE_DEVNET_RPC_URL,
  baseWsEndpoint: SECURE_DEVNET_RPC_WS,
  ephemeralRpcEndpoint: PER_RPC_ENDPOINT,
  ephemeralWsEndpoint: PER_WS_ENDPOINT,
});

const otherLoyalClient = await LoyalPrivateTransactionsClient.fromConfig({
  signer: OTHER_USER_KP,
  baseRpcEndpoint: SECURE_DEVNET_RPC_URL,
  baseWsEndpoint: SECURE_DEVNET_RPC_WS,
  ephemeralRpcEndpoint: PER_RPC_ENDPOINT,
  ephemeralWsEndpoint: PER_WS_ENDPOINT,
});

export const COMMON_MINTS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  CUST: "FiuhQjmbHuCi15VMowXaecYKma5GhovNzaU2EBv3rk6",
} as const;

export async function wrapSolToWSol(opts: {
  connection: Connection;
  payer: Keypair;
  lamports: number;
}): Promise<{ wsolAta: PublicKey; createdAta: boolean }> {
  const { connection, payer, lamports } = opts;

  const wsolAta = await getAssociatedTokenAddress(NATIVE_MINT, payer.publicKey);

  const instructions: TransactionInstruction[] = [];
  let createdAta = false;

  const ataInfo = await connection.getAccountInfo(wsolAta);
  if (!ataInfo) {
    createdAta = true;
    instructions.push(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        wsolAta,
        payer.publicKey,
        NATIVE_MINT
      )
    );
  }

  instructions.push(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: wsolAta,
      lamports,
    })
  );

  instructions.push(createSyncNativeInstruction(wsolAta));

  const tx = new Transaction().add(...instructions);
  await sendAndConfirmTransaction(connection, tx, [payer]);

  return { wsolAta, createdAta };
}

export async function closeWsolAta(opts: {
  connection: Connection;
  payer: Keypair;
  wsolAta: PublicKey;
}): Promise<void> {
  const { connection, payer, wsolAta } = opts;

  try {
    const closeTx = new Transaction().add(
      createCloseAccountInstruction(wsolAta, payer.publicKey, payer.publicKey)
    );
    await sendAndConfirmTransaction(connection, closeTx, [payer]);
  } catch (error) {
    console.error("Failed to close wSOL ATA", error);
  }
}

/**
 * Check which tokens have Loyal deposits. Returns a map of mint → deposit amount (raw).
 */
export async function fetchLoyalDeposits(
  userPublicKey: PublicKey,
  tokenMints: string[]
): Promise<Map<string, number>> {
  const deposits = new Map<string, number>();

  const results = await Promise.allSettled(
    tokenMints.map(async (mint) => {
      const mintPubkey = new PublicKey(mint);
      const baseDeposit = await loyalClient.getBaseDeposit(
        userPublicKey,
        mintPubkey
      );
      const ephemeralDeposit = await loyalClient.getEphemeralDeposit(
        userPublicKey,
        mintPubkey
      );
      if (ephemeralDeposit && ephemeralDeposit.amount > 0) {
        console.log(
          "ephemeralDeposit",
          mintPubkey.toString(),
          ephemeralDeposit.amount
        );
        deposits.set(mint, Number(ephemeralDeposit.amount));
      } else if (baseDeposit && baseDeposit.amount > 0) {
        console.log("baseDeposit", mintPubkey.toString(), baseDeposit.amount);
        deposits.set(mint, Number(baseDeposit.amount));
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

const getConnection = () => solanaConnection;
const getWalletKeypair = async () => USER_KP;
const getLoyalClient = async () => loyalClient;

// export async function transferTokensToUsername(params: {
//   tokenMint: PublicKey;
//   amount: number;
//   destination: string;
// }): Promise<string> {
//   const startTime = Date.now();
//   console.log("> transferTokensToUsername");
//   const keypair = await getWalletKeypair();
//   const client = await getLoyalClient();
//   const { tokenMint, amount, destination } = params;

//   console.log(`< transferTokensToUsername (${Date.now() - startTime}ms)`);

//   return "";
// }

export async function transferTokens(params: {
  tokenMint: PublicKey;
  amount: number;
  destination: PublicKey;
}): Promise<string> {
  const startTime = Date.now();
  console.log("> transferTokens");
  const keypair = await getWalletKeypair();
  const client = await getLoyalClient();
  const { tokenMint, amount, destination } = params;

  const existingBaseDeposit = await client.getBaseDeposit(
    destination,
    tokenMint
  );
  const existingEphemeralDeposit = await client.getEphemeralDeposit(
    destination,
    tokenMint
  );
  console.log("existingBaseDeposit", existingBaseDeposit);
  console.log("existingEphemeralDeposit", existingEphemeralDeposit);
  if (!existingBaseDeposit && !existingEphemeralDeposit) {
    console.log("initializeDeposit");
    const initializeDepositSig = await client.initializeDeposit({
      tokenMint,
      user: destination,
      payer: keypair.publicKey,
    });
    console.log("initializeDeposit sig", initializeDepositSig);
  }

  console.log("delegateDeposit");
  const delegateDepositSig = await client.delegateDeposit({
    tokenMint,
    user: destination,
    payer: keypair.publicKey,
    validator: ER_VALIDATOR,
  });
  console.log("delegateDeposit sig", delegateDepositSig);

  console.log("transferDeposit");
  const transferDepositSig = await client.transferDeposit({
    user: keypair.publicKey,
    tokenMint,
    destinationUser: destination,
    amount,
    payer: keypair.publicKey,
  });
  console.log("transferDeposit sig", transferDepositSig);

  console.log(`< transferTokens (${Date.now() - startTime}ms)`);

  return transferDepositSig;
}

/**
 * Shield tokens: move from regular wallet into Loyal private deposit.
 * Flow: initializeDeposit (if needed) → modifyBalance(increase) → createPermission → delegateDeposit
 */
export async function shieldTokens(params: {
  tokenMint: PublicKey;
  amount: number;
}): Promise<string> {
  const startTime = Date.now();
  console.log("> shieldTokens");
  const keypair = await getWalletKeypair();
  const client = await getLoyalClient();
  const { tokenMint, amount } = params;

  // 1. Initialize deposit if it doesn't exist yet
  const existingDeposit = await client.getBaseDeposit(
    keypair.publicKey,
    tokenMint
  );
  if (!existingDeposit) {
    console.log("initializeDeposit");
    const initializeDepositSig = await client.initializeDeposit({
      tokenMint,
      user: keypair.publicKey,
      payer: keypair.publicKey,
    });
    console.log("initializeDeposit sig", initializeDepositSig);
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
    console.log("wrapSolToWSol wsolAta: ", result.wsolAta.toString());
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
    console.log("closeWsolAta");
    await closeWsolAta({
      connection,
      payer: keypair,
      wsolAta: userTokenAccount,
    });
    console.log("closeWsolAta done");
  }

  // 4. Create permission (may already exist)
  try {
    console.log("createPermission");
    const createPermissionSig = await client.createPermission({
      tokenMint,
      user: keypair.publicKey,
      payer: keypair.publicKey,
    });
    console.log("createPermission sig", createPermissionSig);
  } catch {
    // Permission may already exist, that's fine
  }

  // 5. Delegate deposit to PER
  try {
    console.log("delegateDeposit");
    const delegateDepositSig = await client.delegateDeposit({
      tokenMint,
      user: keypair.publicKey,
      payer: keypair.publicKey,
      validator: ER_VALIDATOR,
    });
    console.log("delegateDeposit sig", delegateDepositSig);
  } catch {
    // May already be delegated
  }

  console.log(`< shieldTokens (${Date.now() - startTime}ms)`);

  return signature;
}

/**
 * Unshield tokens: move from Loyal private deposit back to regular wallet.
 * Flow: undelegateDeposit (via PER) → modifyBalance(decrease) on base layer
 */
export async function unshieldTokens(params: {
  tokenMint: PublicKey;
  amount: number;
  otherClient?: LoyalPrivateTransactionsClient;
  otherKeypair?: Keypair;
}): Promise<string> {
  const startTime = Date.now();
  console.log("> unshieldTokens");

  const { tokenMint, amount, otherClient, otherKeypair } = params;

  const keypair = otherKeypair || (await getWalletKeypair());

  // 1. Undelegate from PER
  const client = otherClient || (await getLoyalClient());

  const connection = getConnection();

  const [depositPda] = findDepositPda(keypair.publicKey, tokenMint);

  const perPepositAccountInfo =
    await client.ephemeralProgram.provider.connection.getAccountInfo(
      depositPda
    );
  console.log(
    "perClient: depositPda owner",
    perPepositAccountInfo?.owner?.toString() ?? "account not found"
  );

  const baseDepositAccountInfo =
    await client.baseProgram.provider.connection.getAccountInfo(depositPda);
  console.log(
    "baseClient: depositPda owner",
    baseDepositAccountInfo?.owner?.toString() ?? "account not found"
  );

  // Subscribe to depositPda owner changes on both connections,
  // resolving when owner matches PROGRAM_ID
  let perResolve: () => void;
  let baseResolve: () => void;
  const perOwnerReady = new Promise<void>((r) => {
    perResolve = r;
  });
  const baseOwnerReady = new Promise<void>((r) => {
    baseResolve = r;
  });

  const perSubId = client.ephemeralProgram.provider.connection.onAccountChange(
    depositPda,
    (accountInfo) => {
      console.log(
        "perClient: depositPda owner changed ->",
        accountInfo.owner.toString()
      );
      if (accountInfo.owner.equals(PROGRAM_ID)) perResolve();
    },
    { commitment: "confirmed" }
  );
  const baseSubId = client.baseProgram.provider.connection.onAccountChange(
    depositPda,
    (accountInfo) => {
      console.log(
        "baseClient: depositPda owner changed ->",
        accountInfo.owner.toString()
      );
      if (accountInfo.owner.equals(PROGRAM_ID)) baseResolve();
    },
    { commitment: "confirmed" }
  );

  // If already owned by PROGRAM_ID, resolve immediately
  if (perPepositAccountInfo?.owner.equals(PROGRAM_ID)) perResolve!();
  if (baseDepositAccountInfo?.owner.equals(PROGRAM_ID)) baseResolve!();

  console.log("undelegateDeposit");
  const undelegateDepositSig = await client.undelegateDeposit({
    tokenMint,
    user: keypair.publicKey,
    payer: keypair.publicKey,
    magicProgram: MAGIC_PROGRAM_ID,
    magicContext: MAGIC_CONTEXT_ID,
  });
  console.log("undelegateDeposit sig", undelegateDepositSig);

  // 2. Withdraw tokens back to regular wallet
  // const baseClient = await getBaseClient();
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

  // Wait for both connections to see depositPda owned by PROGRAM_ID
  console.log(
    "waiting for depositPda owner to be PROGRAM_ID on both connections..."
  );
  await Promise.all([perOwnerReady, baseOwnerReady]);
  console.log("depositPda owner is PROGRAM_ID on both connections");

  console.log("modifyBalance");
  const { signature } = await client.modifyBalance({
    tokenMint,
    amount,
    increase: false,
    user: keypair.publicKey,
    payer: keypair.publicKey,
    userTokenAccount,
  });
  console.log("modifyBalance sig", signature);

  // 3. Unwrap wSOL back to native SOL
  if (isNativeSol) {
    console.log("closeWsolAta");
    await closeWsolAta({
      connection,
      payer: keypair,
      wsolAta: userTokenAccount,
    });
    console.log("closeWsolAta done");
  }

  // Clean up account change subscriptions
  await client.ephemeralProgram.provider.connection.removeAccountChangeListener(
    perSubId
  );
  await client.baseProgram.provider.connection.removeAccountChangeListener(
    baseSubId
  );

  console.log(`< unshieldTokens (${Date.now() - startTime}ms)`);

  return signature;
}

describe("private-transactions shield SDK (PER)", async () => {
  console.log("_____________");
  console.log("wallet", USER.toString());

  const deposits = await fetchLoyalDeposits(USER, Object.values(COMMON_MINTS));
  console.log("deposits", deposits);

  // const mint = await createMint(
  //   solanaConnection,
  //   USER_KP, // payer
  //   USER, // mint authority
  //   USER, // freeze authority
  //   2 // decimals
  // );
  const mint = NATIVE_MINT;
  // const mint = new PublicKey("J1rxYKFSSBoTpnfZexXyVJ9HZdDZg99xCHRDXMKw2h3U");

  console.log("mint", mint.toString());

  // // Mint tokens to wallet's ATA before depositing
  // const ata = await getOrCreateAssociatedTokenAccount(
  //   solanaConnection,
  //   USER_KP, // payer
  //   mint, // mint
  //   USER // owner
  // );
  // console.log("ATA:", ata.address.toString());

  // await mintTo(
  //   solanaConnection,
  //   USER_KP, // payer
  //   mint, // mint
  //   ata.address, // destination
  //   USER_KP, // mint authority
  //   2 * 10 ** 2 // amount in base units (9 decimals)
  // );
  // console.log(`Minted to wallet`);

  const amount = 100000000; // LAMPORTS_PER_SOL / 10
  // const amount = 1 * 10 ** 2;
  const doubleAmount = 2 * amount;

  await shieldTokens({ tokenMint: mint, amount: doubleAmount });
  await transferTokens({
    tokenMint: mint,
    amount,
    destination: OTHER_USER,
  });
  await unshieldTokens({ tokenMint: mint, amount });
  await unshieldTokens({
    tokenMint: mint,
    amount,
    otherClient: otherLoyalClient,
    otherKeypair: OTHER_USER_KP,
  });

  // Transfer back — re-wrap SOL into wSOL if native mint since unshieldTokens closed the ATA
  const isNativeSol = mint.equals(NATIVE_MINT);
  if (isNativeSol) {
    await wrapSolToWSol({
      connection: solanaConnection,
      payer: OTHER_USER_KP,
      lamports: amount,
    });
  }
  const otherUserAta = (
    await getOrCreateAssociatedTokenAccount(
      solanaConnection,
      OTHER_USER_KP,
      mint,
      OTHER_USER
    )
  ).address;
  const userAta = (
    await getOrCreateAssociatedTokenAccount(
      solanaConnection,
      OTHER_USER_KP, // payer
      mint,
      USER
    )
  ).address;
  const transferSig = await transfer(
    solanaConnection,
    OTHER_USER_KP,
    otherUserAta,
    userAta,
    OTHER_USER_KP,
    amount
  );
  console.log("SPL transfer OTHER_USER -> USER sig", transferSig);
});
