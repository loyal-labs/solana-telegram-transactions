import { describe, it, expect, beforeAll } from "bun:test";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Ed25519Program,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotent,
  createMint,
  getAssociatedTokenAddressSync,
  mintToChecked,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  LoyalPrivateTransactionsClient,
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
} from "../index";
import type { TelegramVerification } from "../../../target/types/telegram_verification";

const VALIDATION_BYTES: Uint8Array = new Uint8Array([
  56, 48, 54, 53, 49, 52, 48, 52, 57, 57, 58, 87, 101, 98, 65, 112, 112, 68,
  97, 116, 97, 10, 97, 117, 116, 104, 95, 100, 97, 116, 101, 61, 49, 55, 54,
  51, 53, 57, 56, 51, 55, 53, 10, 99, 104, 97, 116, 95, 105, 110, 115, 116,
  97, 110, 99, 101, 61, 45, 52, 53, 57, 55, 56, 48, 55, 53, 56, 53, 54, 55,
  51, 56, 52, 53, 53, 55, 49, 10, 99, 104, 97, 116, 95, 116, 121, 112, 101,
  61, 115, 101, 110, 100, 101, 114, 10, 117, 115, 101, 114, 61, 123, 34,
  105, 100, 34, 58, 56, 49, 51, 56, 55, 57, 55, 55, 54, 55, 44, 34, 102,
  105, 114, 115, 116, 95, 110, 97, 109, 101, 34, 58, 34, 84, 114, 97, 118,
  105, 115, 34, 44, 34, 108, 97, 115, 116, 95, 110, 97, 109, 101, 34, 58,
  34, 34, 44, 34, 117, 115, 101, 114, 110, 97, 109, 101, 34, 58, 34, 100,
  105, 103, 49, 51, 51, 55, 49, 51, 51, 51, 55, 34, 44, 34, 108, 97, 110,
  103, 117, 97, 103, 101, 95, 99, 111, 100, 101, 34, 58, 34, 101, 110, 34,
  44, 34, 97, 108, 108, 111, 119, 115, 95, 119, 114, 105, 116, 101, 95, 116,
  111, 95, 112, 109, 34, 58, 116, 114, 117, 101, 44, 34, 112, 104, 111, 116,
  111, 95, 117, 114, 108, 34, 58, 34, 104, 116, 116, 112, 115, 58, 92, 47,
  92, 47, 116, 46, 109, 101, 92, 47, 105, 92, 47, 117, 115, 101, 114, 112,
  105, 99, 92, 47, 51, 50, 48, 92, 47, 120, 99, 90, 85, 85, 85, 87, 51, 117,
  74, 50, 99, 79, 80, 86, 73, 81, 85, 111, 99, 104, 105, 119, 72, 99, 56,
  113, 118, 114, 56, 106, 114, 108, 66, 56, 74, 45, 72, 88, 120, 105, 112,
  98, 83, 74, 76, 122, 122, 118, 120, 73, 99, 79, 106, 55, 103, 55, 70, 49,
  69, 78, 116, 72, 71, 46, 115, 118, 103, 34, 125,
]);

const VALIDATION_SIGNATURE_BYTES: Uint8Array = new Uint8Array([
  139, 171, 57, 233, 145, 1, 218, 227, 29, 106, 55, 30, 237, 207, 28, 229,
  22, 234, 202, 160, 221, 31, 219, 251, 151, 181, 118, 207, 216, 254, 57, 79,
  209, 9, 176, 4, 81, 224, 69, 253, 250, 110, 16, 143, 73, 60, 35, 61, 66,
  177, 139, 178, 153, 248, 2, 121, 161, 49, 224, 103, 190, 108, 234, 4,
]);

const VALIDATION_USERNAME = "dig133713337";
const TELEGRAM_ED25519_PUBKEY = Buffer.from(
  "e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d",
  "hex"
);
const COMMIT_POLL_MS = Number(process.env.COMMIT_POLL_MS ?? "200");
const COMMIT_MAX_POLLS = Number(process.env.COMMIT_MAX_POLLS ?? "150");

const deriveWsEndpoint = (rpcUrl: string) =>
  rpcUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryTransfer = (error: unknown) => {
  const message = (error as any)?.message ?? "";
  return (
    message.includes("Unknown action") ||
    message.includes("AccountClonerError") ||
    message.includes("FailedToGetSubscriptionSlot") ||
    message.includes("Timed out waiting for") ||
    message.includes("Transaction") ||
    message.includes("Blockhash not found")
  );
};

const runWithRetries = async <T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 5,
  delayMs = 500
): Promise<T> => {
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (attempt > 1) {
        console.log(`[sdk-test] retry ${label} attempt ${attempt}`);
      }
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!shouldRetryTransfer(err) || attempt === attempts) {
        throw err;
      }
      await sleep(delayMs);
    }
  }
  throw lastErr;
};

describe("private-transactions SDK (PER)", () => {
  const userKp = Keypair.generate();
  const otherUserKp = Keypair.generate();
  const user = userKp.publicKey;
  const otherUser = otherUserKp.publicKey;

  const providerEndpoint =
    process.env.PROVIDER_ENDPOINT ??
    process.env.ANCHOR_PROVIDER_URL ??
    "http://127.0.0.1:8899";
  const wsEndpoint =
    process.env.WS_ENDPOINT ??
    (providerEndpoint.includes("localhost") ||
    providerEndpoint.includes("127.0.0.1")
      ? "ws://127.0.0.1:8900"
      : deriveWsEndpoint(providerEndpoint));
  const ephemeralProviderEndpoint =
    process.env.EPHEMERAL_PROVIDER_ENDPOINT ?? "http://127.0.0.1:7799";
  const ephemeralWsEndpoint =
    process.env.EPHEMERAL_WS_ENDPOINT ??
    (ephemeralProviderEndpoint.includes("localhost") ||
    ephemeralProviderEndpoint.includes("127.0.0.1")
      ? "ws://127.0.0.1:7800"
      : deriveWsEndpoint(ephemeralProviderEndpoint));
  const commitment =
    (process.env.PROVIDER_COMMITMENT as anchor.web3.Commitment) ?? "confirmed";

  const erValidator = new PublicKey(
    process.env.ER_VALIDATOR ??
      process.env.MAGICBLOCK_VALIDATOR ??
      "mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev"
  );

  const connection = new anchor.web3.Connection(providerEndpoint, {
    wsEndpoint,
    commitment,
  });

  const initialAmount = 1_000_000;
  const depositAmount = 200_000;
  const claimAmount = 100_000;
  const transferAmount = 100_000;

  let tokenMint: PublicKey;
  let userTokenAccount: PublicKey;
  let otherUserTokenAccount: PublicKey;
  let sessionPda: PublicKey;
  let verificationProgram: Program<TelegramVerification>;

  let clientUser: LoyalPrivateTransactionsClient;
  let clientOther: LoyalPrivateTransactionsClient;
  let ephemeralClientUser: LoyalPrivateTransactionsClient;
  let ephemeralClientOther: LoyalPrivateTransactionsClient;

  beforeAll(async () => {
    console.log("[sdk-test] base RPC", providerEndpoint);
    console.log("[sdk-test] base WS", wsEndpoint);
    console.log("[sdk-test] ER RPC", ephemeralProviderEndpoint);
    console.log("[sdk-test] ER WS", ephemeralWsEndpoint);
    clientUser = LoyalPrivateTransactionsClient.from(connection, userKp);
    clientOther = LoyalPrivateTransactionsClient.from(connection, otherUserKp);
    ephemeralClientUser = await LoyalPrivateTransactionsClient.fromEphemeral({
      signer: userKp,
      rpcEndpoint: ephemeralProviderEndpoint,
      wsEndpoint: ephemeralWsEndpoint,
      commitment,
    });
    ephemeralClientOther = await LoyalPrivateTransactionsClient.fromEphemeral({
      signer: otherUserKp,
      rpcEndpoint: ephemeralProviderEndpoint,
      wsEndpoint: ephemeralWsEndpoint,
      commitment,
    });
    console.log(
      "[sdk-test] ephemeral user RPC",
      ephemeralClientUser.getProgram().provider.connection.rpcEndpoint
    );
    console.log(
      "[sdk-test] ephemeral other RPC",
      ephemeralClientOther.getProgram().provider.connection.rpcEndpoint
    );

    const verificationIdl = JSON.parse(
      await Bun.file("../../target/idl/telegram_verification.json").text()
    ) as TelegramVerification;
    const verificationProvider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(otherUserKp),
      {
        commitment,
        preflightCommitment: commitment,
      }
    );
    verificationProgram = new Program<TelegramVerification>(
      verificationIdl,
      verificationProvider
    );

    for (const kp of [userKp, otherUserKp]) {
      const balance = await connection.getBalance(kp.publicKey, "confirmed");
      if (balance > 0.2 * LAMPORTS_PER_SOL) {
        continue;
      }
      const sig = await connection.requestAirdrop(
        kp.publicKey,
        1 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(sig, "confirmed");
    }

    tokenMint = await createMint(
      connection,
      userKp,
      user,
      null,
      6,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    userTokenAccount = await createAssociatedTokenAccountIdempotent(
      connection,
      userKp,
      tokenMint,
      user,
      undefined,
      TOKEN_PROGRAM_ID
    );

    otherUserTokenAccount = await createAssociatedTokenAccountIdempotent(
      connection,
      userKp,
      tokenMint,
      otherUser,
      undefined,
      TOKEN_PROGRAM_ID
    );

    await mintToChecked(
      connection,
      userKp,
      tokenMint,
      userTokenAccount,
      user,
      initialAmount,
      6,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    [sessionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tg_session"), otherUser.toBuffer()],
      verificationProgram.programId
    );
  });

  it("runs deposit, delegate, private transfer, claim, and undelegate flow", async () => {
    const rpcOptions = { skipPreflight: true };

    console.log("[sdk-test] initialize deposit");
    await clientUser.initializeDeposit({
      tokenMint,
      user,
      payer: user,
      rpcOptions,
    });
    console.log("[sdk-test] modify balance");
    const depositResult = await clientUser.modifyBalance({
      tokenMint,
      amount: initialAmount,
      increase: true,
      user,
      payer: user,
      userTokenAccount,
      rpcOptions,
    });
    expect(depositResult.deposit.amount).toBe(initialAmount);

    console.log("[sdk-test] create permission + delegate deposit");
    await runWithRetries("createPermission", () =>
      clientUser.createPermission({
        tokenMint,
        user,
        payer: user,
        rpcOptions,
      })
    );
    await runWithRetries("delegateDeposit", () =>
      clientUser.delegateDeposit({
        tokenMint,
        user,
        payer: user,
        validator: erValidator,
        rpcOptions,
      })
    );

    console.log("[sdk-test] deposit for username");
    await mintToChecked(
      connection,
      userKp,
      tokenMint,
      userTokenAccount,
      user,
      depositAmount,
      6,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    try {
      await runWithRetries("depositForUsername", () =>
        clientUser.depositForUsername({
          username: VALIDATION_USERNAME,
          tokenMint,
          amount: depositAmount,
          depositor: user,
          payer: user,
          depositorTokenAccount: userTokenAccount,
          rpcOptions,
        })
      );
    } catch (err) {
      try {
        const [depositPda] = clientUser.findUsernameDepositPda(
          VALIDATION_USERNAME,
          tokenMint
        );
        const [vaultPda] = clientUser.findVaultPda(tokenMint);
        const vaultTokenAccount = getAssociatedTokenAddressSync(
          tokenMint,
          vaultPda,
          true,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const sim = await clientUser
          .getProgram()
          .methods.depositForUsername(
            VALIDATION_USERNAME,
            new anchor.BN(depositAmount)
          )
          .accountsPartial({
            payer: user,
            depositor: user,
            deposit: depositPda,
            vault: vaultPda,
            vaultTokenAccount,
            depositorTokenAccount: userTokenAccount,
            tokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([userKp])
          .simulate();
        console.error("[sdk-test] depositForUsername simulate logs", sim.logs);
      } catch (simErr) {
        console.error("[sdk-test] depositForUsername simulate error", simErr);
      }
      throw err;
    }

    console.log("[sdk-test] store + verify telegram initData");
    await runWithRetries("storeTelegramSession", () =>
      verificationProgram.methods
        .store(Buffer.from(VALIDATION_BYTES))
        .accounts({
          payer: otherUser,
          user: otherUser,
          // @ts-ignore
          session: sessionPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([otherUserKp])
        .rpc({ commitment: "confirmed" })
    );

    const ed25519Ix = Ed25519Program.createInstructionWithPublicKey({
      publicKey: TELEGRAM_ED25519_PUBKEY,
      message: VALIDATION_BYTES,
      signature: VALIDATION_SIGNATURE_BYTES,
    });
    const verifyIx = await verificationProgram.methods
      .verifyTelegramInitData()
      .accounts({
        session: sessionPda,
        // @ts-ignore
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();
    const verifyTx = new Transaction().add(ed25519Ix, verifyIx);
    const { blockhash } = await connection.getLatestBlockhash();
    verifyTx.feePayer = otherUser;
    verifyTx.recentBlockhash = blockhash;
    verifyTx.sign(otherUserKp);
    const verifySig = await runWithRetries("verifyTelegramSession", () =>
      connection.sendRawTransaction(verifyTx.serialize())
    );
    await connection.confirmTransaction(verifySig, "confirmed");

    console.log("[sdk-test] claim username deposit");
    const balanceBefore = await connection.getTokenAccountBalance(
      otherUserTokenAccount
    );
    await runWithRetries("claimUsernameDeposit", () =>
      clientOther.claimUsernameDeposit({
        username: VALIDATION_USERNAME,
        tokenMint,
        amount: claimAmount,
        recipient: otherUser,
        recipientTokenAccount: otherUserTokenAccount,
        session: sessionPda,
        rpcOptions,
      })
    );
    const balanceAfter = await connection.getTokenAccountBalance(
      otherUserTokenAccount
    );
    expect(Number(balanceAfter.value.amount)).toBeGreaterThan(
      Number(balanceBefore.value.amount)
    );

    console.log("[sdk-test] create permission + delegate username deposit");
    await runWithRetries("createUsernamePermission", () =>
      clientOther.createUsernamePermission({
        username: VALIDATION_USERNAME,
        tokenMint,
        session: sessionPda,
        authority: otherUser,
        payer: otherUser,
        rpcOptions,
      })
    );
    await runWithRetries("delegateUsernameDeposit", () =>
      clientOther.delegateUsernameDeposit({
        username: VALIDATION_USERNAME,
        tokenMint,
        session: sessionPda,
        payer: otherUser,
        validator: erValidator,
        rpcOptions,
      })
    );

    console.log("[sdk-test] private transfer to username deposit (PER)");
    const maxAttempts = Number(process.env.TRANSFER_RETRIES ?? "30");
    const retryDelayMs = Number(process.env.TRANSFER_RETRY_DELAY_MS ?? "1000");
    let transferSig: string | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        transferSig = await ephemeralClientUser.transferToUsernameDeposit({
          username: VALIDATION_USERNAME,
          tokenMint,
          amount: transferAmount,
          user,
          payer: user,
          sessionToken: null,
          rpcOptions,
        });
        break;
      } catch (err) {
        if (!shouldRetryTransfer(err) || attempt === maxAttempts) {
          throw err;
        }
        await sleep(retryDelayMs);
      }
    }
    expect(transferSig).not.toBeNull();

    if (transferSig) {
      await ephemeralClientUser
        .getProgram()
        .provider.connection.confirmTransaction(transferSig);
    }

    let erUsernameDeposit = await ephemeralClientOther.getUsernameDeposit(
      VALIDATION_USERNAME,
      tokenMint
    );
    for (let i = 0; i < 25 && !erUsernameDeposit; i += 1) {
      await sleep(200);
      erUsernameDeposit = await ephemeralClientOther.getUsernameDeposit(
        VALIDATION_USERNAME,
        tokenMint
      );
    }
    expect(erUsernameDeposit?.amount).toBe(
      depositAmount - claimAmount + transferAmount
    );

    console.log("[sdk-test] undelegate username deposit + user deposit");
    const undelegateUsernameSig = await runWithRetries(
      "undelegateUsernameDeposit",
      () =>
        ephemeralClientOther.undelegateUsernameDeposit({
          username: VALIDATION_USERNAME,
          tokenMint,
          session: sessionPda,
          payer: otherUser,
          magicProgram: MAGIC_PROGRAM_ID,
          magicContext: MAGIC_CONTEXT_ID,
          rpcOptions,
        })
    );
    await ephemeralClientOther
      .getProgram()
      .provider.connection.confirmTransaction(undelegateUsernameSig);

    const undelegateSig = await runWithRetries("undelegateDeposit", () =>
      ephemeralClientUser.undelegateDeposit({
        tokenMint,
        user,
        payer: user,
        magicProgram: MAGIC_PROGRAM_ID,
        magicContext: MAGIC_CONTEXT_ID,
        rpcOptions,
      })
    );
    await ephemeralClientUser
      .getProgram()
      .provider.connection.confirmTransaction(undelegateSig);

    console.log("[sdk-test] wait for base commit");
    let baseUsernameDeposit = await clientUser.getUsernameDeposit(
      VALIDATION_USERNAME,
      tokenMint
    );
    for (let i = 0; i < COMMIT_MAX_POLLS; i += 1) {
      if (
        baseUsernameDeposit &&
        baseUsernameDeposit.amount === depositAmount - claimAmount + transferAmount
      ) {
        break;
      }
      await sleep(COMMIT_POLL_MS);
      baseUsernameDeposit = await clientUser.getUsernameDeposit(
        VALIDATION_USERNAME,
        tokenMint
      );
    }
    expect(baseUsernameDeposit?.amount).toBe(
      depositAmount - claimAmount + transferAmount
    );

    let baseUserDeposit = await clientUser.getDeposit(user, tokenMint);
    for (let i = 0; i < COMMIT_MAX_POLLS; i += 1) {
      if (
        baseUserDeposit &&
        baseUserDeposit.amount === initialAmount - transferAmount
      ) {
        break;
      }
      await sleep(COMMIT_POLL_MS);
      baseUserDeposit = await clientUser.getDeposit(user, tokenMint);
    }
    expect(baseUserDeposit?.amount).toBe(initialAmount - transferAmount);
  });
});
