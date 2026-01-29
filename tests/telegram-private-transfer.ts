import * as anchor from "@coral-xyz/anchor";
import { Program, Idl } from "@coral-xyz/anchor";
import { TelegramPrivateTransfer } from "../target/types/telegram_private_transfer";
import {
  getAuthToken,
  PERMISSION_PROGRAM_ID,
  permissionPdaFromAccount,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import telegramPrivateTransferIdl from "../target/idl/telegram_private_transfer.json";
import {
  createAssociatedTokenAccountIdempotent,
  createMint,
  getAssociatedTokenAddressSync,
  mintToChecked,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import {
  Transaction,
  SystemProgram,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  SendTransactionError,
} from "@solana/web3.js";
import { sign } from "tweetnacl";

const DEPOSIT_PDA_SEED = Buffer.from("deposit");
const VAULT_PDA_SEED = Buffer.from("vault");
let lastLogMs: number | null = null;
const formatTime = (date: Date) => date.toISOString().slice(11, 23);
const formatDelta = (ms: number) => `(+${(ms / 1000).toFixed(2)}s)`;
const log = (...args: unknown[]) => {
  const now = Date.now();
  const delta = lastLogMs === null ? 0 : now - lastLogMs;
  lastLogMs = now;
  console.log(`${formatTime(new Date(now))} ${formatDelta(delta)}`, ...args);
};
const logError = (...args: unknown[]) => {
  const now = Date.now();
  const delta = lastLogMs === null ? 0 : now - lastLogMs;
  lastLogMs = now;
  console.error(`${formatTime(new Date(now))} ${formatDelta(delta)}`, ...args);
};
const awaitWithLog = async <T>(
  label: string,
  promise: Promise<T>
): Promise<T> => {
  log("await", label);
  return await promise;
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const shouldRetryTransfer = (error: unknown) => {
  const message = (error as any)?.message ?? "";
  return (
    message.includes("AccountClonerError") ||
    message.includes("FailedToGetSubscriptionSlot") ||
    message.includes("Timed out waiting for") ||
    message.includes("Transaction") ||
    message.includes("Blockhash not found")
  );
};
const logSendTransactionError = async (
  err: unknown,
  connection: anchor.web3.Connection,
  label: string
) => {
  const error = err as any;
  logError(`${label} error`, error?.message ?? error);
  if (error?.error) {
    try {
      logError(`${label} error details`, JSON.stringify(error.error));
    } catch {
      logError(`${label} error details`, error.error);
    }
  }
  if (error?.logs) {
    logError(`${label} logs`, error.logs);
    return;
  }
  if (
    error instanceof SendTransactionError &&
    typeof error.getLogs === "function"
  ) {
    try {
      const confirmedConnection = new anchor.web3.Connection(
        connection.rpcEndpoint,
        { commitment: "confirmed" }
      );
      const logsPromise =
        error.getLogs.length > 0
          ? error.getLogs(confirmedConnection)
          : error.getLogs();
      const logs = await awaitWithLog(`${label} getLogs`, logsPromise);
      logError(`${label} logs`, logs);
    } catch (logErr) {
      logError(`${label} getLogs failed`, logErr);
    }
  } else if (typeof error?.getLogs === "function") {
    try {
      const confirmedConnection = new anchor.web3.Connection(
        connection.rpcEndpoint,
        { commitment: "confirmed" }
      );
      const logsPromise =
        error.getLogs.length > 0
          ? error.getLogs(confirmedConnection)
          : error.getLogs();
      const logs = await awaitWithLog(`${label} getLogs`, logsPromise);
      logError(`${label} logs`, logs);
    } catch (logErr) {
      logError(`${label} getLogs failed`, logErr);
    }
  }
};
const waitForAccount = async (
  connection: anchor.web3.Connection,
  pubkey: PublicKey,
  label: string
) => {
  for (let i = 0; i < 50; i += 1) {
    const info = await awaitWithLog(
      `getAccountInfo ${label}`,
      connection.getAccountInfo(pubkey)
    );
    if (info) {
      return;
    }
    if (i === 0) {
      log(`Waiting for ${label} to appear on ER...`);
    }
    await awaitWithLog(`sleep 100ms (${label})`, sleep(100));
  }
  throw new Error(`Timed out waiting for ${label} on ER`);
};

describe("telegram-private-transfer", () => {
  const userKp = Keypair.generate();
  const wallet = new anchor.Wallet(userKp);
  const otherUserKp = Keypair.generate();

  const providerEndpoint =
    process.env.PROVIDER_ENDPOINT ??
    process.env.ANCHOR_PROVIDER_URL ??
    "http://127.0.0.1:8899";
  const wsEndpoint = process.env.WS_ENDPOINT ?? "ws://127.0.0.1:8900";
  const ephemeralProviderEndpoint =
    process.env.EPHEMERAL_PROVIDER_ENDPOINT ?? "http://127.0.0.1:7799";
  const commitment =
    (process.env.PROVIDER_COMMITMENT as anchor.web3.Commitment) ?? "processed";
  const deriveWsEndpoint = (rpcUrl: string) =>
    rpcUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  const ephemeralWsEndpoint =
    process.env.EPHEMERAL_WS_ENDPOINT ??
    (ephemeralProviderEndpoint.includes("localhost") ||
    ephemeralProviderEndpoint.includes("127.0.0.1")
      ? "ws://127.0.0.1:7800"
      : deriveWsEndpoint(ephemeralProviderEndpoint));
  const provider = new anchor.AnchorProvider(
    new anchor.web3.Connection(providerEndpoint, {
      wsEndpoint,
      commitment,
    }),
    wallet,
    {
      commitment,
      preflightCommitment: commitment,
    }
  );
  anchor.setProvider(provider);
  log("Provider commitment", commitment);
  const erValidator = new PublicKey(
    process.env.ER_VALIDATOR ??
      process.env.MAGICBLOCK_VALIDATOR ??
      "mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev"
  );

  const program = new Program<TelegramPrivateTransfer>(
    telegramPrivateTransferIdl,
    provider
  );
  let ephemeralProgramUser: Program<TelegramPrivateTransfer>;
  let ephemeralProgramOtherUser: Program<TelegramPrivateTransfer>;
  let baseProgramOtherUser: Program<TelegramPrivateTransfer>;
  const user = userKp.publicKey;
  const otherUser = otherUserKp.publicKey;
  let tokenMint: PublicKey,
    userTokenAccount: PublicKey,
    vaultPda: PublicKey,
    vaultTokenAccount: PublicKey;
  const initialAmount = 1000000;
  let depositPda: PublicKey, otherDepositPda: PublicKey;
  let basePerf: { elapsedMs: number; tps: number } | null = null;

  before(async () => {
    const hasEphemeralToken = ephemeralProviderEndpoint.includes("token=");
    const useEphemeralAuth =
      process.env.EPHEMERAL_AUTH === "true" ||
      (!hasEphemeralToken &&
        (ephemeralProviderEndpoint.includes("tee.magicblock.app") ||
          ephemeralProviderEndpoint.includes("magicblock.app")));
    const ephemeralRpcBase = ephemeralProviderEndpoint;
    const ephemeralWsBase = ephemeralWsEndpoint;
    let userEphemeralRpc = ephemeralRpcBase;
    let userEphemeralWs = ephemeralWsBase;
    if (useEphemeralAuth) {
      const { token } = await awaitWithLog(
        "getAuthToken user",
        getAuthToken(
          ephemeralRpcBase,
          wallet.publicKey,
          async (message) => sign.detached(message, userKp.secretKey)
        )
      );
      userEphemeralRpc = `${ephemeralRpcBase}?token=${token}`;
      userEphemeralWs = `${ephemeralWsBase}?token=${token}`;
    }
    const ephemeralProviderUser = new anchor.AnchorProvider(
      new anchor.web3.Connection(userEphemeralRpc, {
        wsEndpoint: userEphemeralWs,
        commitment,
      }),
      wallet,
      {
        commitment,
        preflightCommitment: commitment,
      }
    );
    ephemeralProgramUser = new Program<TelegramPrivateTransfer>(
      telegramPrivateTransferIdl,
      ephemeralProviderUser
    );

    let otherEphemeralRpc = ephemeralRpcBase;
    let otherEphemeralWs = ephemeralWsBase;
    if (useEphemeralAuth) {
      const { token: otherToken } = await awaitWithLog(
        "getAuthToken other user",
        getAuthToken(
          ephemeralRpcBase,
          otherUserKp.publicKey,
          async (message) => sign.detached(message, otherUserKp.secretKey)
        )
      );
      otherEphemeralRpc = `${ephemeralRpcBase}?token=${otherToken}`;
      otherEphemeralWs = `${ephemeralWsBase}?token=${otherToken}`;
    }
    const ephemeralProviderOtherUser = new anchor.AnchorProvider(
      new anchor.web3.Connection(otherEphemeralRpc, {
        wsEndpoint: otherEphemeralWs,
        commitment,
      }),
      new anchor.Wallet(otherUserKp),
      {
        commitment,
        preflightCommitment: commitment,
      }
    );
    ephemeralProgramOtherUser = new Program<TelegramPrivateTransfer>(
      telegramPrivateTransferIdl,
      ephemeralProviderOtherUser
    );
    baseProgramOtherUser = new Program<TelegramPrivateTransfer>(
      telegramPrivateTransferIdl,
      new anchor.AnchorProvider(
        provider.connection,
        new anchor.Wallet(otherUserKp),
        {
          commitment,
          preflightCommitment: commitment,
        }
      )
    );

    const faucet = anchor.Wallet.local();

    // Airdrop SOL to the users
    for (const kp of [userKp, otherUserKp]) {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: faucet.publicKey,
          toPubkey: kp.publicKey,
          lamports: 0.1 * LAMPORTS_PER_SOL,
        })
      );
      tx.recentBlockhash = (
        await awaitWithLog(
          "getLatestBlockhash",
          provider.connection.getLatestBlockhash()
        )
      ).blockhash;
      tx.feePayer = faucet.publicKey;
      let signedTx = await awaitWithLog(
        "faucet.signTransaction",
        faucet.signTransaction(tx)
      );
      let rawTx = signedTx.serialize();
      let sig = await awaitWithLog(
        "sendRawTransaction",
        provider.connection.sendRawTransaction(rawTx)
      );
      await awaitWithLog(
        "confirmTransaction (airdrop transfer)",
        provider.connection.confirmTransaction(sig)
      );
    }

    let balance = await awaitWithLog(
      "getBalance user",
      provider.connection.getBalance(userKp.publicKey)
    );
    log("Balance", balance);
    while (balance === 0) {
      log("Airdropping...");
      await awaitWithLog("sleep 100ms (airdrop)", sleep(100));
      balance = await awaitWithLog(
        "getBalance user (retry)",
        provider.connection.getBalance(userKp.publicKey)
      );
    }
    if (balance === 0) throw new Error("airdrop failed...");

    log("Creating mint...");
    tokenMint = await awaitWithLog(
      "createMint",
      createMint(
        provider.connection,
        userKp,
        user,
        null,
        6,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
      )
    );

    let mintInfo = await awaitWithLog(
      "getAccountInfo tokenMint",
      provider.connection.getAccountInfo(tokenMint)
    );
    while (mintInfo === null) {
      log("Waiting for mint to be created...");
      await awaitWithLog("sleep 100ms (mint)", sleep(100));
      mintInfo = await awaitWithLog(
        "getAccountInfo tokenMint (retry)",
        provider.connection.getAccountInfo(tokenMint)
      );
    }

    depositPda = PublicKey.findProgramAddressSync(
      [Buffer.from(DEPOSIT_PDA_SEED), user.toBuffer(), tokenMint.toBuffer()],
      program.programId
    )[0];
    otherDepositPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from(DEPOSIT_PDA_SEED),
        otherUser.toBuffer(),
        tokenMint.toBuffer(),
      ],
      program.programId
    )[0];
    vaultPda = PublicKey.findProgramAddressSync(
      [Buffer.from(VAULT_PDA_SEED), tokenMint.toBuffer()],
      program.programId
    )[0];
    vaultTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      vaultPda,
      true,
      TOKEN_PROGRAM_ID
    );

    log("Creating user token account...");
    userTokenAccount = await awaitWithLog(
      "createAssociatedTokenAccountIdempotent",
      createAssociatedTokenAccountIdempotent(
        provider.connection,
        userKp,
        tokenMint,
        user,
        undefined,
        TOKEN_PROGRAM_ID
      )
    );

    let userTokenInfo = await awaitWithLog(
      "getAccountInfo userTokenAccount",
      provider.connection.getAccountInfo(userTokenAccount)
    );
    while (userTokenInfo === null) {
      log("Waiting for user token account to be created...");
      await awaitWithLog("sleep 100ms (user token)", sleep(100));
      userTokenInfo = await awaitWithLog(
        "getAccountInfo userTokenAccount (retry)",
        provider.connection.getAccountInfo(userTokenAccount)
      );
    }

    log("Minting tokens to user...");
    // Mint tokens to the user
    await awaitWithLog(
      "mintToChecked",
      mintToChecked(
        provider.connection,
        userKp,
        tokenMint,
        userTokenAccount,
        user,
        new anchor.BN(initialAmount) as any,
        6,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
      )
    );

    log("User token account", userTokenAccount.toBase58());
    log("Vault token account", vaultTokenAccount.toBase58());
    log("Deposit PDA", depositPda.toBase58());
    log("Other deposit PDA", otherDepositPda.toBase58());
    log("User", user.toBase58());
    log("Other user", otherUser.toBase58());
    log("Token mint", tokenMint.toBase58());
  });

  it("Initialize deposits", async () => {
    await awaitWithLog(
      "initializeDeposit (user)",
      program.methods
        .initializeDeposit()
        .accountsPartial({
          user,
          deposit: depositPda,
          tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ skipPreflight: true })
    );

    let deposit = await awaitWithLog(
      "fetch deposit (user)",
      program.account.deposit.fetch(depositPda)
    );
    assert.equal(deposit.amount.toNumber(), 0);

    const tx = await awaitWithLog(
      "initializeDeposit (other user)",
      program.methods
        .initializeDeposit()
        .accountsPartial({
          user: otherUser,
          deposit: otherDepositPda,
          tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ skipPreflight: true })
    );
    log("Initialize deposit tx", tx);
    await awaitWithLog(
      "confirmTransaction (initialize deposit other)",
      provider.connection.confirmTransaction(tx)
    );

    deposit = await awaitWithLog(
      "fetch deposit (other)",
      program.account.deposit.fetch(otherDepositPda)
    );
    assert.equal(deposit.amount.toNumber(), 0);
  });

  it("Modify balance", async () => {
    let tx = await awaitWithLog(
      "modifyBalance +initial/2",
      program.methods
        .modifyBalance({
          amount: new anchor.BN(initialAmount / 2),
          increase: true,
        })
        .accountsPartial({
          user,
          payer: user,
          deposit: depositPda,
          userTokenAccount,
          vault: vaultPda,
          vaultTokenAccount,
          tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ skipPreflight: true })
    );
    log("Modify balance tx", tx);
    await awaitWithLog(
      "confirmTransaction (modify +initial/2)",
      provider.connection.confirmTransaction(tx)
    );

    let deposit = await awaitWithLog(
      "fetch deposit (after +initial/2)",
      program.account.deposit.fetch(depositPda)
    );
    assert.equal(deposit.amount.toNumber(), initialAmount / 2);

    tx = await awaitWithLog(
      "modifyBalance -initial/4",
      program.methods
        .modifyBalance({
          amount: new anchor.BN(initialAmount / 4),
          increase: false,
        })
        .accountsPartial({
          user,
          payer: user,
          deposit: depositPda,
          userTokenAccount,
          vault: vaultPda,
          vaultTokenAccount,
          tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ skipPreflight: true })
    );
    log("Modify balance tx", tx);
    await awaitWithLog(
      "confirmTransaction (modify -initial/4)",
      provider.connection.confirmTransaction(tx)
    );

    deposit = await awaitWithLog(
      "fetch deposit (after -initial/4)",
      program.account.deposit.fetch(depositPda)
    );
    assert.equal(deposit.amount.toNumber(), initialAmount / 4);

    tx = await awaitWithLog(
      "modifyBalance +3/4 initial",
      program.methods
        .modifyBalance({
          amount: new anchor.BN((3 * initialAmount) / 4),
          increase: true,
        })
        .accountsPartial({
          user,
          payer: user,
          deposit: depositPda,
          userTokenAccount,
          vault: vaultPda,
          vaultTokenAccount,
          tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc({ skipPreflight: true })
    );
    log("Modify balance tx", tx);
    await awaitWithLog(
      "confirmTransaction (modify +3/4)",
      provider.connection.confirmTransaction(tx)
    );

    deposit = await awaitWithLog(
      "fetch deposit (after +3/4)",
      program.account.deposit.fetch(depositPda)
    );
    assert.equal(deposit.amount.toNumber(), initialAmount);
  });

  it("Performance: transferDeposit base", async () => {
    const perfTransfers = Number(process.env.PERF_TRANSFERS ?? "50");
    const perfAmount = new anchor.BN(Number(process.env.PERF_AMOUNT ?? "1"));

    basePerf = await awaitWithLog(
      "runTransfers BASE",
      runTransfers(
        "BASE",
        {
          user: program,
          other: baseProgramOtherUser,
        },
        perfTransfers,
        perfAmount
      )
    );
  });

  it("Create permission", async () => {
    for (const { deposit, kp } of [
      { deposit: depositPda, kp: userKp },
      { deposit: otherDepositPda, kp: otherUserKp },
    ]) {
      const permission = permissionPdaFromAccount(deposit);

      let tx = await awaitWithLog(
        `createPermission ${kp.publicKey.toBase58()}`,
        program.methods
          .createPermission()
          .accountsPartial({
            payer: kp.publicKey,
            user: kp.publicKey,
            deposit,
            permission,
            permissionProgram: PERMISSION_PROGRAM_ID,
          })
          .signers([kp])
          .rpc({ skipPreflight: true })
      );
      log("Create permission tx", tx);
      await awaitWithLog(
        "confirmTransaction (create permission)",
        provider.connection.confirmTransaction(tx)
      );
    }
  });

  it("Delegate", async () => {
    for (const { deposit, kp } of [
      { deposit: depositPda, kp: userKp },
      { deposit: otherDepositPda, kp: otherUserKp },
    ]) {
      const tx = await awaitWithLog(
        `delegate ${kp.publicKey.toBase58()}`,
        program.methods
          .delegate(kp.publicKey, tokenMint)
          .accountsPartial({
            payer: kp.publicKey,
            deposit,
            validator: erValidator,
          })
          .signers([kp])
          .rpc({ skipPreflight: true })
      );
      log("Delegate tx", tx);
      await awaitWithLog(
        "confirmTransaction (delegate)",
        provider.connection.confirmTransaction(tx)
      );
    }
  });

  it("Transfer", async () => {
    log(
      "Ephemeral RPC endpoint",
      ephemeralProgramUser.provider.connection.rpcEndpoint
    );
    let tx: string | null = null;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      log(`Transfer attempt ${attempt}`);
      try {
        tx = await awaitWithLog(
          `transferDeposit attempt ${attempt}`,
          ephemeralProgramUser.methods
            .transferDeposit(new anchor.BN(initialAmount / 2))
            .accountsPartial({
              user,
              sourceDeposit: depositPda,
              destinationDeposit: otherDepositPda,
              sessionToken: null,
              tokenMint,
            })
            .signers([userKp])
            .rpc({ skipPreflight: true })
        );
        break;
      } catch (err) {
        await awaitWithLog(
          `logSendTransactionError Transfer attempt ${attempt}`,
          logSendTransactionError(
            err,
            ephemeralProgramUser.provider.connection,
            "Transfer"
          )
        );
        if (!shouldRetryTransfer(err) || attempt === 5) {
          throw err;
        }
        await awaitWithLog(
          `sleep 500ms (transfer retry ${attempt})`,
          sleep(500)
        );
      }
    }
    if (!tx) {
      throw new Error("Transfer failed without a transaction signature");
    }
    log(
      "Ephemeral RPC endpoint",
      ephemeralProgramOtherUser.provider.connection.rpcEndpoint
    );
    log("Transfer tx", tx);
    await awaitWithLog(
      "confirmTransaction (transfer)",
      ephemeralProgramUser.provider.connection.confirmTransaction(tx)
    );

    let deposit = await awaitWithLog(
      "fetch deposit (user, after transfer)",
      ephemeralProgramUser.account.deposit.fetch(depositPda)
    );
    assert.equal(deposit.amount.toNumber(), initialAmount / 2);

    deposit = await awaitWithLog(
      "fetch deposit (other, after transfer)",
      ephemeralProgramOtherUser.account.deposit.fetch(otherDepositPda)
    );
    assert.equal(deposit.amount.toNumber(), initialAmount / 2);
  });

  const runTransfers = async (
    label: string,
    perfPrograms: {
      user: Program<TelegramPrivateTransfer>;
      other: Program<TelegramPrivateTransfer>;
    },
    perfTransfers: number,
    perfAmount: anchor.BN
  ) => {
    const start = Date.now();
    for (let i = 0; i < perfTransfers; i += 1) {
      const isUser = i % 2 === 0;
      const pairIndex = Math.floor(i / 2);
      const transferAmount = perfAmount.add(new anchor.BN(pairIndex));
      const source = isUser ? depositPda : otherDepositPda;
      const destination = isUser ? otherDepositPda : depositPda;
      const signer = isUser ? userKp : otherUserKp;
      const userKey = isUser ? user : otherUser;
      const perfProgram = isUser ? perfPrograms.user : perfPrograms.other;
      let sig: string;
      try {
        sig = await awaitWithLog(
          `${label} transfer ${i + 1}/${perfTransfers}`,
          perfProgram.methods
            .transferDeposit(transferAmount)
            .accountsPartial({
              user: userKey,
              sourceDeposit: source,
              destinationDeposit: destination,
              sessionToken: null,
              tokenMint,
            })
            .signers([signer])
            .rpc({ skipPreflight: true })
        );
      } catch (err) {
        await awaitWithLog(
          `logSendTransactionError ${label} transfer ${i + 1}`,
          logSendTransactionError(err, perfProgram.provider.connection, label)
        );
        throw err;
      }
      await awaitWithLog(
        `${label} confirm ${i + 1}/${perfTransfers}`,
        perfProgram.provider.connection.confirmTransaction(sig)
      );
    }
    const elapsedMs = Date.now() - start;
    const tps = perfTransfers / (elapsedMs / 1000);
    log(
      `${label} performance`,
      `count=${perfTransfers}`,
      `ms=${elapsedMs}`,
      `tps=${tps.toFixed(2)}`
    );
    return { elapsedMs, tps };
  };

  it("Performance: transferDeposit ER", async () => {
    const perfTransfers = Number(process.env.PERF_TRANSFERS ?? "50");
    const perfAmount = new anchor.BN(Number(process.env.PERF_AMOUNT ?? "1"));

    const erPerf = await awaitWithLog(
      "runTransfers ER",
      runTransfers(
        "ER",
        {
          user: ephemeralProgramUser,
          other: ephemeralProgramOtherUser,
        },
        perfTransfers,
        perfAmount
      )
    );
    if (basePerf) {
      log("Perf summary", {
        base: basePerf,
        er: erPerf,
        speedup: (erPerf.tps / basePerf.tps).toFixed(2),
      });
    }
  });
});
