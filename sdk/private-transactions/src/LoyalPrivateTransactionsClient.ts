import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
  sendAndConfirmRawTransaction,
  type Commitment,
  type BlockhashWithExpiryBlockHeight,
  type ConfirmOptions,
  type Signer,
} from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  verifyTeeRpcIntegrity,
  getAuthToken,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import { sign } from "tweetnacl";
import type { TelegramPrivateTransfer } from "./idl/telegram_private_transfer.ts";
import idl from "./idl/telegram_private_transfer.json";
import {
  PROGRAM_ID,
  DELEGATION_PROGRAM_ID,
  PERMISSION_PROGRAM_ID,
  ER_VALIDATOR,
} from "./constants";
import {
  findDepositPda,
  findUsernameDepositPda,
  findVaultPda,
  findTreasuryPda,
  findPermissionPda,
  findDelegationRecordPda,
  findDelegationMetadataPda,
  findBufferPda,
} from "./pda";
import { InternalWalletAdapter } from "./wallet-adapter";
import { isKeypair, isAnchorProvider } from "./types";
import type {
  WalletSigner,
  WalletLike,
  RpcOptions,
  ClientConfig,
  DepositData,
  UsernameDepositData,
  TreasuryData,
  InitializeDepositParams,
  ModifyBalanceParams,
  ModifyBalanceResult,
  DepositForUsernameParams,
  ClaimUsernameDepositParams,
  CreatePermissionParams,
  CreateUsernamePermissionParams,
  InitializeTreasuryParams,
  CreateTreasuryPermissionParams,
  DelegateDepositParams,
  DelegateUsernameDepositParams,
  DelegateTreasuryParams,
  UndelegateDepositParams,
  UndelegateUsernameDepositParams,
  UndelegateTreasuryParams,
  WithdrawTreasuryFeesParams,
  TransferDepositParams,
  TransferToUsernameDepositParams,
  InitializeUsernameDepositParams,
  ClaimUsernameDepositToDepositParams,
  DelegationStatusResponse,
} from "./types";

function prettyStringify(obj: unknown): string {
  const json = JSON.stringify(
    obj,
    (_key, value) => {
      if (value instanceof PublicKey) return value.toBase58();
      if (typeof value === "bigint") return value.toString();
      return value;
    },
    2
  );
  // Collapse arrays onto single lines
  return json.replace(/\[\s+(\d[\d,\s]*\d)\s+\]/g, (_match, inner) => {
    const items = inner.split(/,\s*/).map((s: string) => s.trim());
    return `[${items.join(", ")}]`;
  });
}

/**
 * Create a typed Program instance from the IDL
 */
function createProgram(
  provider: AnchorProvider
): Program<TelegramPrivateTransfer> {
  return new Program(idl as TelegramPrivateTransfer, provider);
}

function programFromRpc(
  signer: WalletSigner,
  commitment: Commitment,
  rpcEndpoint: string,
  wsEndpoint?: string
): Program<TelegramPrivateTransfer> {
  const adapter = InternalWalletAdapter.from(signer);
  const baseConnection = new Connection(rpcEndpoint, {
    wsEndpoint: wsEndpoint,
    commitment,
  });
  const baseProvider = new AnchorProvider(baseConnection, adapter, {
    commitment,
  });
  return createProgram(baseProvider);
}

type MagicRouterConnection = Connection & {
  getLatestBlockhashForTransaction: (
    transaction: Transaction,
    options?: ConfirmOptions
  ) => Promise<BlockhashWithExpiryBlockHeight>;
};

/**
 * Derive a message signing function from any supported signer type.
 * Required for PER auth token acquisition.
 */
function deriveMessageSigner(
  signer: WalletSigner
): (message: Uint8Array) => Promise<Uint8Array> {
  if (isKeypair(signer)) {
    return (message: Uint8Array) =>
      Promise.resolve(sign.detached(message, signer.secretKey));
  }

  if (isAnchorProvider(signer)) {
    const wallet = signer.wallet as {
      signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
    };
    if (typeof wallet.signMessage === "function") {
      return (message: Uint8Array) => wallet.signMessage!(message);
    }
    throw new Error(
      "AnchorProvider wallet does not support signMessage, required for PER auth"
    );
  }

  // WalletLike
  const walletLike = signer as {
    signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  };
  if (typeof walletLike.signMessage === "function") {
    return (message: Uint8Array) => walletLike.signMessage!(message);
  }
  throw new Error("Wallet does not support signMessage, required for PER auth");
}

// Subscribe for changes (before transaction) and start polling (should be awaited after transaction).
// Returns an object with `wait()` to start polling and `cancel()` to clean up the subscription
// if the transaction fails before `wait()` is called.
export function waitForAccountOwnerChange(
  connection: Connection,
  account: PublicKey,
  expectedOwner: PublicKey,
  timeoutMs = 15_000,
  intervalMs = 1_000
): { wait: () => Promise<void>; cancel: () => Promise<void> } {
  let skipWait: () => void;
  const subId = connection.onAccountChange(
    account,
    (accountInfo) => {
      if (accountInfo.owner.equals(expectedOwner) && skipWait) {
        console.log(
          `waitForAccountOwnerChange: ${account.toString()} – short-circuit polling wait`
        );
        skipWait();
      }
    },
    { commitment: "confirmed" }
  );

  const cleanup = async () => {
    await connection.removeAccountChangeListener(subId);
  };

  const wait = async () => {
    try {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const info = await connection.getAccountInfo(account, "confirmed");
        if (info && info.owner.equals(expectedOwner)) {
          console.log(
            `waitForAccountOwnerChange: ${account.toString()} appeared with owner ${expectedOwner.toString()} after ${
              Date.now() - start
            }ms`
          );
          return;
        }
        if (info) {
          console.log(
            `waitForAccountOwnerChange: ${account.toString()} exists but owner is ${info.owner.toString()}, expected ${expectedOwner.toString()}`
          );
        }
        await new Promise<void>((r) => {
          skipWait = r;
          setTimeout(r, intervalMs);
        });
      }
      throw new Error(
        `waitForAccountOwnerChange: ${account.toString()} did not appear with owner ${expectedOwner.toString()} after ${timeoutMs}ms`
      );
    } finally {
      await cleanup();
    }
  };

  return { wait, cancel: cleanup };
}

/**
 * LoyalPrivateTransactionsClient - SDK for interacting with the Telegram Private Transfer program
 * with MagicBlock PER (Private Ephemeral Rollups) support
 *
 * @example
 * // Base layer client with keypair
 * const client = LoyalPrivateTransactionsClient.from(connection, keypair);
 *
 * // Ephemeral rollup client
 * const ephemeralClient = await LoyalPrivateTransactionsClient.fromEphemeral({
 *   signer: keypair,
 *   rpcEndpoint: "http://localhost:7799",
 *   wsEndpoint: "ws://localhost:7800",
 * });
 *
 * // Deposit tokens and delegate to PER
 * await client.initializeDeposit({ user, tokenMint, payer });
 * await client.modifyBalance({ user, tokenMint, amount: 1000000, increase: true, ... });
 * await client.createPermission({ user, tokenMint, payer });
 * await client.delegateDeposit({ user, tokenMint, payer, validator });
 *
 * // Execute private transfers on ephemeral rollup
 * await ephemeralClient.transferToUsernameDeposit({ username, tokenMint, amount, ... });
 *
 * // Commit and undelegate
 * await ephemeralClient.undelegateDeposit({ user, tokenMint, ... });
 */
export class LoyalPrivateTransactionsClient {
  readonly baseProgram: Program<TelegramPrivateTransfer>;
  readonly ephemeralProgram: Program<TelegramPrivateTransfer>;
  readonly wallet: WalletLike;

  private constructor(
    baseProgram: Program<TelegramPrivateTransfer>,
    ephemeralProgram: Program<TelegramPrivateTransfer>,
    wallet: WalletLike
  ) {
    this.baseProgram = baseProgram;
    this.ephemeralProgram = ephemeralProgram;
    this.wallet = wallet;
  }

  // ============================================================
  // Factory Methods
  // ============================================================

  /**
   * Create client connected to an ephemeral rollup endpoint with PER auth token.
   * Verifies TEE RPC integrity and obtains an auth token automatically.
   */
  static async fromConfig(
    config: ClientConfig
  ): Promise<LoyalPrivateTransactionsClient> {
    const {
      signer,
      baseRpcEndpoint,
      baseWsEndpoint,
      ephemeralRpcEndpoint,
      ephemeralWsEndpoint,
      commitment = "confirmed",
      authToken,
    } = config;

    const adapter = InternalWalletAdapter.from(signer);

    const baseProgram = programFromRpc(
      signer,
      commitment,
      baseRpcEndpoint,
      baseWsEndpoint
    );

    let finalEphemeralRpcEndpoint = ephemeralRpcEndpoint;
    let finalEphemeralWsEndpoint = ephemeralWsEndpoint;

    if (ephemeralRpcEndpoint.includes("tee")) {
      let token: string;
      let expiresAt: number;
      if (!authToken) {
        try {
          const isVerified = await verifyTeeRpcIntegrity(ephemeralRpcEndpoint);
          if (!isVerified) {
            console.error(
              "[LoyalClient] TEE RPC integrity verification returned false"
            );
          }
        } catch (e) {
          console.error(
            "[LoyalClient] TEE RPC integrity verification error:",
            e
          );
        }

        const signMessage = deriveMessageSigner(signer);

        ({ token, expiresAt } = await getAuthToken(
          ephemeralRpcEndpoint,
          adapter.publicKey,
          signMessage
        ));
      } else {
        token = authToken.token;
      }

      finalEphemeralRpcEndpoint = `${ephemeralRpcEndpoint}?token=${token}`;
      finalEphemeralWsEndpoint = ephemeralWsEndpoint
        ? `${ephemeralWsEndpoint}?token=${token}`
        : undefined;
    }

    const ephemeralProgram = programFromRpc(
      signer,
      commitment,
      finalEphemeralRpcEndpoint,
      finalEphemeralWsEndpoint
    );

    return new LoyalPrivateTransactionsClient(
      baseProgram,
      ephemeralProgram,
      adapter
    );
  }

  // ============================================================
  // Deposit Operations
  // ============================================================

  /**
   * Initialize a deposit account for a user and token mint
   */
  async initializeDeposit(params: InitializeDepositParams): Promise<string> {
    const { user, tokenMint, payer, rpcOptions } = params;

    const [depositPda] = findDepositPda(user, tokenMint);

    await this.ensureNotDelegated(depositPda, "modifyBalance-depositPda", true);

    const signature = await this.baseProgram.methods
      .initializeDeposit()
      .accountsPartial({
        payer,
        user,
        tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc(rpcOptions);

    return signature;
  }

  async initializeUsernameDeposit(
    params: InitializeUsernameDepositParams
  ): Promise<string> {
    const { username, tokenMint, payer, rpcOptions } = params;

    const [usernameDepositPda] = findUsernameDepositPda(username, tokenMint);

    await this.ensureNotDelegated(
      usernameDepositPda,
      "modifyBalance-depositPda",
      true
    );

    const signature = await this.baseProgram.methods
      .initializeUsernameDeposit(username)
      .accountsPartial({
        payer,
        tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc(rpcOptions);

    return signature;
  }

  async initializeTreasury(params: InitializeTreasuryParams): Promise<string> {
    const { admin, tokenMint, payer, rpcOptions } = params;
    const [treasuryPda] = findTreasuryPda(tokenMint);

    await this.ensureNotDelegated(treasuryPda, "initializeTreasury-treasury", true);

    return this.baseProgram.methods
      .initializeTreasury()
      .accountsPartial({
        payer,
        admin,
        treasury: treasuryPda,
        tokenMint,
        systemProgram: SystemProgram.programId,
      })
      .rpc(rpcOptions);
  }

  /**
   * Modify the balance of a user's deposit account
   */
  async modifyBalance(
    params: ModifyBalanceParams
  ): Promise<ModifyBalanceResult> {
    const {
      user,
      tokenMint,
      amount,
      increase,
      payer,
      userTokenAccount,
      rpcOptions,
    } = params;

    const [depositPda] = findDepositPda(user, tokenMint);

    await this.ensureNotDelegated(depositPda, "modifyBalance-depositPda");

    const [vaultPda] = findVaultPda(tokenMint);
    const vaultTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      vaultPda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log("modifyBalance", {
      payer: payer.toString(),
      user: user.toString(),
      vault: vaultPda.toString(),
      deposit: depositPda.toString(),
      userTokenAccount: userTokenAccount.toString(),
      vaultTokenAccount: vaultTokenAccount.toString(),
      tokenMint: tokenMint.toString(),
      // tokenProgram: TOKEN_PROGRAM_ID,
      // associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      // systemProgram: SystemProgram.programId,
    });

    const signature = await this.baseProgram.methods
      .modifyBalance({ amount: new BN(amount.toString()), increase })
      .accountsPartial({
        payer,
        user,
        vault: vaultPda,
        deposit: depositPda,
        userTokenAccount,
        vaultTokenAccount,
        tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc(rpcOptions);

    const deposit = await this.getBaseDeposit(user, tokenMint);
    if (!deposit) {
      throw new Error("Failed to fetch deposit after modification");
    }

    return { signature, deposit };
  }

  /**
   * Deposit tokens for a Telegram username
   */
  async depositForUsername(params: DepositForUsernameParams): Promise<string> {
    // TODO: deprecate
    const {
      username,
      tokenMint,
      amount,
      depositor,
      payer,
      depositorTokenAccount,
      rpcOptions,
    } = params;

    this.validateUsername(username);

    const [depositPda] = findUsernameDepositPda(username, tokenMint);

    await this.ensureDelegated(depositPda, "depositForUsername-depositPda");

    // TODO: you don't need Vault while depositing!
    const [vaultPda] = findVaultPda(tokenMint);
    const vaultTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      vaultPda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const signature = await this.ephemeralProgram.methods
      .depositForUsername(username, new BN(amount.toString()))
      .accountsPartial({
        payer,
        depositor,
        deposit: depositPda,
        vault: vaultPda,
        vaultTokenAccount,
        depositorTokenAccount,
        tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc(rpcOptions);

    return signature;
  }

  /**
   * Claim tokens from a username-based deposit
   */
  async claimUsernameDeposit(
    params: ClaimUsernameDepositParams
  ): Promise<string> {
    const {
      username,
      tokenMint,
      amount,
      recipientTokenAccount,
      session,
      rpcOptions,
    } = params;

    this.validateUsername(username);

    const [depositPda] = findUsernameDepositPda(username, tokenMint);

    await this.ensureDelegated(depositPda, "claimUsernameDeposit-depositPda");

    // TODO: you don't need Vault while claiming!
    const [vaultPda] = findVaultPda(tokenMint);
    const vaultTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      vaultPda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const signature = await this.ephemeralProgram.methods
      .claimUsernameDeposit(new BN(amount.toString()))
      .accountsPartial({
        recipientTokenAccount,
        vault: vaultPda,
        vaultTokenAccount,
        deposit: depositPda,
        tokenMint,
        session,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc(rpcOptions);

    return signature;
  }

  async claimUsernameDepositToDeposit(
    params: ClaimUsernameDepositToDepositParams
  ): Promise<string> {
    const { username, tokenMint, amount, recipient, session, rpcOptions } =
      params;

    this.validateUsername(username);

    const [sourceUsernameDeposit] = findUsernameDepositPda(username, tokenMint);
    const [destinationDeposit] = findDepositPda(recipient, tokenMint);

    await this.ensureDelegated(
      sourceUsernameDeposit,
      "claimUsernameDepositToDeposit-sourceUsernameDeposit"
    );
    await this.ensureDelegated(
      destinationDeposit,
      "claimUsernameDepositToDeposit-destinationDeposit"
    );

    const accounts: Record<string, PublicKey | null> = {
      user: recipient,
      sourceUsernameDeposit,
      destinationDeposit,
      tokenMint,
      session,
      tokenProgram: TOKEN_PROGRAM_ID,
    };
    console.log(
      "claimUsernameDepositToDeposit accounts:",
      prettyStringify(accounts)
    );

    // Fetch and log account info for debugging
    const connection = this.baseProgram.provider.connection;
    const [srcInfo, dstInfo, sessionInfo] = await Promise.all([
      connection.getAccountInfo(sourceUsernameDeposit),
      connection.getAccountInfo(destinationDeposit),
      connection.getAccountInfo(session),
    ]);
    console.log(
      "claimUsernameDepositToDeposit sourceUsernameDeposit accountInfo:",
      prettyStringify({
        address: sourceUsernameDeposit.toBase58(),
        exists: !!srcInfo,
        owner: srcInfo?.owner?.toBase58(),
        lamports: srcInfo?.lamports,
        dataLen: srcInfo?.data?.length,
        executable: srcInfo?.executable,
      })
    );
    console.log(
      "claimUsernameDepositToDeposit destinationDeposit accountInfo:",
      prettyStringify({
        address: destinationDeposit.toBase58(),
        exists: !!dstInfo,
        owner: dstInfo?.owner?.toBase58(),
        lamports: dstInfo?.lamports,
        dataLen: dstInfo?.data?.length,
        executable: dstInfo?.executable,
      })
    );
    console.log(
      "claimUsernameDepositToDeposit session accountInfo:",
      prettyStringify({
        address: session.toBase58(),
        exists: !!sessionInfo,
        owner: sessionInfo?.owner?.toBase58(),
        lamports: sessionInfo?.lamports,
        dataLen: sessionInfo?.data?.length,
        executable: sessionInfo?.executable,
      })
    );

    try {
      const sim = await this.ephemeralProgram.methods
        .claimUsernameDepositToDeposit(new BN(amount.toString()))
        .accountsPartial(accounts)
        .simulate();
      console.log("claimUsernameDepositToDeposit simulation logs:", sim.raw);
    } catch (simErr: unknown) {
      const simResponse = (
        simErr as {
          simulationResponse?: {
            logs?: string[];
            err?: unknown;
            unitsConsumed?: number;
          };
        }
      ).simulationResponse;
      console.error("claimUsernameDepositToDeposit simulate FAILED");
      console.error(
        "  error message:",
        simErr instanceof Error ? simErr.message : String(simErr)
      );
      if (simResponse) {
        console.error("  simulation err:", prettyStringify(simResponse.err));
        console.error("  simulation logs:", prettyStringify(simResponse.logs));
        console.error("  unitsConsumed:", simResponse.unitsConsumed);
      }
      throw simErr;
    }

    const signature = await this.ephemeralProgram.methods
      .claimUsernameDepositToDeposit(new BN(amount.toString()))
      .accountsPartial(accounts)
      .rpc({ skipPreflight: true, commitment: "confirmed" });

    return signature;
  }

  // ============================================================
  // Permission Operations
  // ============================================================

  /**
   * Create a permission for a deposit account (required for PER)
   */
  async createPermission(
    params: CreatePermissionParams
  ): Promise<string | null> {
    const { user, tokenMint, payer, rpcOptions } = params;

    const [depositPda] = findDepositPda(user, tokenMint);
    const [permissionPda] = findPermissionPda(depositPda);

    await this.ensureNotDelegated(depositPda, "createPermission-depositPda");

    if (await this.permissionAccountExists(permissionPda)) {
      return null;
    }

    try {
      const signature = await this.baseProgram.methods
        .createPermission()
        .accountsPartial({
          payer,
          user,
          deposit: depositPda,
          permission: permissionPda,
          permissionProgram: PERMISSION_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc(rpcOptions);

      return signature;
    } catch (err) {
      if (this.isAccountAlreadyInUse(err)) {
        return "permission-exists";
      }
      throw err;
    }
  }

  /**
   * Create a permission for a username-based deposit account
   */
  async createUsernamePermission(
    params: CreateUsernamePermissionParams
  ): Promise<string | null> {
    const { username, tokenMint, session, authority, payer, rpcOptions } =
      params;

    this.validateUsername(username);

    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    const [permissionPda] = findPermissionPda(depositPda);

    await this.ensureNotDelegated(
      depositPda,
      "createUsernamePermission-depositPda"
    );

    if (await this.permissionAccountExists(permissionPda)) {
      return null;
    }

    try {
      const signature = await this.baseProgram.methods
        .createUsernamePermission()
        .accountsPartial({
          payer,
          authority,
          deposit: depositPda,
          session,
          permission: permissionPda,
          permissionProgram: PERMISSION_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc(rpcOptions);

      return signature;
    } catch (err) {
      if (this.isAccountAlreadyInUse(err)) {
        return "permission-exists";
      }
      throw err;
    }
  }

  /**
   * Create a permission for the treasury account
   */
  async createTreasuryPermission(
    params: CreateTreasuryPermissionParams
  ): Promise<string | null> {
    const { admin, tokenMint, payer, rpcOptions } = params;

    const [treasuryPda] = findTreasuryPda(tokenMint);
    const [permissionPda] = findPermissionPda(treasuryPda);

    await this.ensureNotDelegated(
      treasuryPda,
      "createTreasuryPermission-treasury"
    );

    if (await this.permissionAccountExists(permissionPda)) {
      return null;
    }

    try {
      return await this.baseProgram.methods
        .createTreasuryPermission()
        .accountsPartial({
          payer,
          admin,
          treasury: treasuryPda,
          permission: permissionPda,
          permissionProgram: PERMISSION_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc(rpcOptions);
    } catch (err) {
      if (this.isAccountAlreadyInUse(err)) {
        return "permission-exists";
      }
      throw err;
    }
  }

  // ============================================================
  // Delegation Operations
  // ============================================================

  /**
   * Delegate a deposit account to the ephemeral rollup
   */
  async delegateDeposit(params: DelegateDepositParams): Promise<string> {
    const { user, tokenMint, payer, validator, rpcOptions } = params;

    const [depositPda] = findDepositPda(user, tokenMint);
    const [bufferPda] = findBufferPda(depositPda);
    const [delegationRecordPda] = findDelegationRecordPda(depositPda);
    const [delegationMetadataPda] = findDelegationMetadataPda(depositPda);

    await this.ensureNotDelegated(depositPda, "delegateDeposit-depositPda");

    const accounts: Record<string, PublicKey | null> = {
      payer,
      bufferDeposit: bufferPda,
      delegationRecordDeposit: delegationRecordPda,
      delegationMetadataDeposit: delegationMetadataPda,
      deposit: depositPda,
      validator,
      ownerProgram: PROGRAM_ID,
      delegationProgram: DELEGATION_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    const signature = await this.baseProgram.methods
      .delegate(user, tokenMint)
      .accountsPartial(accounts)
      .rpc(rpcOptions);

    return signature;
  }

  /**
   * Delegate a username-based deposit account to the ephemeral rollup
   */
  async delegateUsernameDeposit(
    params: DelegateUsernameDepositParams
  ): Promise<string> {
    const {
      username,
      tokenMint,
      // session,
      payer,
      validator,
      rpcOptions,
    } = params;

    this.validateUsername(username);

    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    const [bufferPda] = findBufferPda(depositPda);
    const [delegationRecordPda] = findDelegationRecordPda(depositPda);
    const [delegationMetadataPda] = findDelegationMetadataPda(depositPda);

    await this.ensureNotDelegated(
      depositPda,
      "delegateUsernameDeposit-depositPda"
    );

    const accounts: Record<string, PublicKey | null> = {
      payer,
      // session,
      bufferDeposit: bufferPda,
      delegationRecordDeposit: delegationRecordPda,
      delegationMetadataDeposit: delegationMetadataPda,
      deposit: depositPda,
      ownerProgram: PROGRAM_ID,
      delegationProgram: DELEGATION_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    accounts.validator = validator ?? null;

    const signature = await this.baseProgram.methods
      .delegateUsernameDeposit(username, tokenMint)
      .accountsPartial(accounts)
      .rpc(rpcOptions);

    return signature;
  }

  /**
   * Delegate treasury account to the ephemeral rollup
   */
  async delegateTreasury(params: DelegateTreasuryParams): Promise<string> {
    const { admin, tokenMint, payer, validator, rpcOptions } = params;
    const [treasuryPda] = findTreasuryPda(tokenMint);
    const [bufferPda] = findBufferPda(treasuryPda);
    const [delegationRecordPda] = findDelegationRecordPda(treasuryPda);
    const [delegationMetadataPda] = findDelegationMetadataPda(treasuryPda);

    await this.ensureNotDelegated(treasuryPda, "delegateTreasury-treasury");

    const accounts: Record<string, PublicKey | null> = {
      payer,
      admin,
      bufferTreasury: bufferPda,
      delegationRecordTreasury: delegationRecordPda,
      delegationMetadataTreasury: delegationMetadataPda,
      treasury: treasuryPda,
      ownerProgram: PROGRAM_ID,
      delegationProgram: DELEGATION_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      validator: validator ?? null,
    };

    return this.baseProgram.methods
      .delegateTreasury(tokenMint)
      .accountsPartial(accounts)
      .rpc(rpcOptions);
  }

  /**
   * Undelegate a deposit account from the ephemeral rollup.
   * Waits for both base and ephemeral connections to confirm the deposit
   * is owned by PROGRAM_ID before returning.
   */
  async undelegateDeposit(params: UndelegateDepositParams): Promise<string> {
    const {
      user,
      tokenMint,
      payer,
      sessionToken,
      magicProgram,
      magicContext,
      rpcOptions,
    } = params;

    const [depositPda] = findDepositPda(user, tokenMint);

    await this.ensureDelegated(
      depositPda,
      "undelegateDeposit-depositPda",
      true
    );

    const accounts: Record<string, PublicKey | null> = {
      user,
      payer,
      deposit: depositPda,
      magicProgram,
      magicContext,
    };
    accounts.sessionToken = sessionToken ?? null;

    const delegationWatcher = waitForAccountOwnerChange(
      this.baseProgram.provider.connection,
      depositPda,
      PROGRAM_ID
    );

    let signature;
    try {
      console.log("undelegateDeposit Accounts:", prettyStringify(accounts));
      signature = await this.ephemeralProgram.methods
        .undelegate()
        .accountsPartial(accounts)
        .rpc(rpcOptions);
      console.log(
        "undelegateDeposit: waiting for depositPda owner to be PROGRAM_ID on base connection..."
      );
      await delegationWatcher.wait();
    } catch (e) {
      await delegationWatcher.cancel();
      throw e;
    }

    return signature;
  }

  /**
   * Undelegate a username-based deposit account from the ephemeral rollup
   */
  async undelegateUsernameDeposit(
    params: UndelegateUsernameDepositParams
  ): Promise<string> {
    const {
      username,
      tokenMint,
      session,
      payer,
      magicProgram,
      magicContext,
      rpcOptions,
    } = params;

    this.validateUsername(username);

    const [depositPda] = findUsernameDepositPda(username, tokenMint);

    await this.ensureDelegated(
      depositPda,
      "undelegateUsernameDeposit-depositPda"
    );

    const signature = await this.ephemeralProgram.methods
      .undelegateUsernameDeposit(username, tokenMint)
      .accountsPartial({
        payer,
        session,
        deposit: depositPda,
        magicProgram,
        magicContext,
      })
      .rpc(rpcOptions);

    return signature;
  }

  /**
   * Undelegate treasury account from the ephemeral rollup
   */
  async undelegateTreasury(params: UndelegateTreasuryParams): Promise<string> {
    const { admin, tokenMint, payer, magicProgram, magicContext, rpcOptions } =
      params;
    const [treasuryPda] = findTreasuryPda(tokenMint);

    await this.ensureDelegated(treasuryPda, "undelegateTreasury-treasury", true);

    const delegationWatcher = waitForAccountOwnerChange(
      this.baseProgram.provider.connection,
      treasuryPda,
      PROGRAM_ID
    );

    let signature: string;
    try {
      signature = await this.ephemeralProgram.methods
        .undelegateTreasury()
        .accountsPartial({
          payer,
          admin,
          treasury: treasuryPda,
          magicProgram,
          magicContext,
        })
        .rpc(rpcOptions);
      await delegationWatcher.wait();
    } catch (e) {
      await delegationWatcher.cancel();
      throw e;
    }

    return signature;
  }

  /**
   * Withdraw accrued transfer fees from treasury.
   */
  async withdrawTreasuryFees(params: WithdrawTreasuryFeesParams): Promise<string> {
    const { admin, tokenMint, amount, rpcOptions } = params;
    const [treasuryPda] = findTreasuryPda(tokenMint);
    const [vaultPda] = findVaultPda(tokenMint);
    const vaultTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      vaultPda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const adminTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      admin,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    await this.ensureNotDelegated(
      treasuryPda,
      "withdrawTreasuryFees-treasury"
    );

    return this.baseProgram.methods
      .withdrawTreasuryFees(new BN(amount.toString()))
      .accountsPartial({
        admin,
        treasury: treasuryPda,
        vault: vaultPda,
        vaultTokenAccount,
        adminTokenAccount,
        tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc(rpcOptions);
  }

  // ============================================================
  // Transfer Operations
  // ============================================================

  /**
   * Transfer between two user deposits
   */
  async transferDeposit(params: TransferDepositParams): Promise<string> {
    const {
      user,
      tokenMint,
      destinationUser,
      amount,
      payer,
      sessionToken,
      rpcOptions,
    } = params;

    const [sourceDepositPda] = findDepositPda(user, tokenMint);
    const [destinationDepositPda] = findDepositPda(destinationUser, tokenMint);
    const treasuryPda = await this.ensureTreasuryPrepared(
      tokenMint,
      payer,
      rpcOptions
    );

    await this.ensureDelegated(
      sourceDepositPda,
      "transferDeposit-sourceDepositPda"
    );
    await this.ensureDelegated(
      destinationDepositPda,
      "transferDeposit-destinationDepositPda"
    );

    const accounts: Record<string, PublicKey | null> = {
      user,
      payer,
      sourceDeposit: sourceDepositPda,
      destinationDeposit: destinationDepositPda,
      treasury: treasuryPda,
      tokenMint,
      systemProgram: SystemProgram.programId,
    };
    accounts.sessionToken = sessionToken ?? null;

    console.log("transferDeposit Accounts:");
    Object.entries(accounts).forEach(([key, value]) => {
      console.log(key, value && value.toString());
    });
    console.log("-----");

    const signature = await this.ephemeralProgram.methods
      .transferDeposit(new BN(amount.toString()))
      .accountsPartial(accounts)
      .rpc(rpcOptions);

    return signature;
  }

  /**
   * Transfer from a user deposit to a username deposit
   */
  async transferToUsernameDeposit(
    params: TransferToUsernameDepositParams
  ): Promise<string> {
    const {
      username,
      tokenMint,
      amount,
      user,
      payer,
      sessionToken,
      rpcOptions,
    } = params;

    this.validateUsername(username);

    const [sourceDepositPda] = findDepositPda(user, tokenMint);
    const [destinationDepositPda] = findUsernameDepositPda(username, tokenMint);
    const treasuryPda = await this.ensureTreasuryPrepared(
      tokenMint,
      payer,
      rpcOptions
    );

    await this.ensureDelegated(
      sourceDepositPda,
      "transferToUsernameDeposit-sourceDepositPda"
    );
    await this.ensureDelegated(
      destinationDepositPda,
      "transferToUsernameDeposit-destinationDepositPda"
    );

    const accounts: Record<string, PublicKey | null> = {
      user,
      payer,
      sourceDeposit: sourceDepositPda,
      destinationDeposit: destinationDepositPda,
      treasury: treasuryPda,
      tokenMint,
      systemProgram: SystemProgram.programId,
    };
    accounts.sessionToken = sessionToken ?? null;

    const signature = await this.ephemeralProgram.methods
      .transferToUsernameDeposit(new BN(amount.toString()))
      .accountsPartial(accounts)
      .rpc(rpcOptions);

    return signature;
  }

  // ============================================================
  // Query Methods
  // ============================================================

  /**
   * Get deposit data for a user and token mint
   */
  async getBaseDeposit(
    user: PublicKey,
    tokenMint: PublicKey
  ): Promise<DepositData | null> {
    const [depositPda] = findDepositPda(user, tokenMint);

    try {
      const account = await this.baseProgram.account.deposit.fetch(depositPda);
      return {
        user: account.user,
        tokenMint: account.tokenMint,
        amount: BigInt(account.amount.toString()),
        address: depositPda,
      };
    } catch {
      return null;
    }
  }

  async getEphemeralDeposit(
    user: PublicKey,
    tokenMint: PublicKey
  ): Promise<DepositData | null> {
    const [depositPda] = findDepositPda(user, tokenMint);

    try {
      const account = await this.ephemeralProgram.account.deposit.fetch(
        depositPda
      );
      return {
        user: account.user,
        tokenMint: account.tokenMint,
        amount: BigInt(account.amount.toString()),
        address: depositPda,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get username deposit data
   */
  async getBaseUsernameDeposit(
    username: string,
    tokenMint: PublicKey
  ): Promise<UsernameDepositData | null> {
    const [depositPda] = findUsernameDepositPda(username, tokenMint);

    try {
      const account = await this.baseProgram.account.usernameDeposit.fetch(
        depositPda
      );
      return {
        username: account.username,
        tokenMint: account.tokenMint,
        amount: BigInt(account.amount.toString()),
        address: depositPda,
      };
    } catch {
      return null;
    }
  }

  async getEphemeralUsernameDeposit(
    username: string,
    tokenMint: PublicKey
  ): Promise<UsernameDepositData | null> {
    const [depositPda] = findUsernameDepositPda(username, tokenMint);

    try {
      const account = await this.ephemeralProgram.account.usernameDeposit.fetch(
        depositPda
      );
      return {
        username: account.username,
        tokenMint: account.tokenMint,
        amount: BigInt(account.amount.toString()),
        address: depositPda,
      };
    } catch {
      return null;
    }
  }

  async getBaseTreasury(tokenMint: PublicKey): Promise<TreasuryData | null> {
    const [treasuryPda] = findTreasuryPda(tokenMint);

    try {
      const account = await this.baseProgram.account.treasury.fetch(treasuryPda);
      return {
        admin: account.admin,
        tokenMint: account.tokenMint,
        amount: BigInt(account.amount.toString()),
        address: treasuryPda,
      };
    } catch {
      return null;
    }
  }

  async getEphemeralTreasury(tokenMint: PublicKey): Promise<TreasuryData | null> {
    const [treasuryPda] = findTreasuryPda(tokenMint);

    try {
      const account = await this.ephemeralProgram.account.treasury.fetch(
        treasuryPda
      );
      return {
        admin: account.admin,
        tokenMint: account.tokenMint,
        amount: BigInt(account.amount.toString()),
        address: treasuryPda,
      };
    } catch {
      return null;
    }
  }

  // ============================================================
  // PDA Helpers
  // ============================================================

  /**
   * Find the deposit PDA for a user and token mint
   */
  findDepositPda(user: PublicKey, tokenMint: PublicKey): [PublicKey, number] {
    return findDepositPda(user, tokenMint, PROGRAM_ID);
  }

  /**
   * Find the username deposit PDA
   */
  findUsernameDepositPda(
    username: string,
    tokenMint: PublicKey
  ): [PublicKey, number] {
    return findUsernameDepositPda(username, tokenMint, PROGRAM_ID);
  }

  /**
   * Find the vault PDA
   */
  findVaultPda(tokenMint: PublicKey): [PublicKey, number] {
    return findVaultPda(tokenMint, PROGRAM_ID);
  }

  /**
   * Find the treasury PDA
   */
  findTreasuryPda(tokenMint: PublicKey): [PublicKey, number] {
    return findTreasuryPda(tokenMint, PROGRAM_ID);
  }

  // ============================================================
  // Accessors
  // ============================================================

  /**
   * Get the connected wallet's public key
   */
  get publicKey(): PublicKey {
    return this.wallet.publicKey;
  }

  /**
   * Get the underlying Anchor program instance
   */
  getBaseProgram(): Program<TelegramPrivateTransfer> {
    return this.baseProgram;
  }

  getEphemeralProgram(): Program<TelegramPrivateTransfer> {
    return this.ephemeralProgram;
  }

  /**
   * Get the program ID
   */
  getProgramId(): PublicKey {
    return PROGRAM_ID;
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private async ensureTreasuryPrepared(
    tokenMint: PublicKey,
    payer: PublicKey,
    rpcOptions?: RpcOptions
  ): Promise<PublicKey> {
    const [treasuryPda] = findTreasuryPda(tokenMint);
    const treasuryInfo =
      await this.baseProgram.provider.connection.getAccountInfo(treasuryPda);

    if (!treasuryInfo) {
      throw new Error(
        "Treasury is not initialized for this mint. Admin must run initializeTreasury, createTreasuryPermission, and delegateTreasury first."
      );
    }

    const isDelegated = treasuryInfo.owner.equals(DELEGATION_PROGRAM_ID);

    if (!isDelegated) {
      throw new Error(
        "Treasury is not delegated for this mint. Admin must call delegateTreasury before transfers."
      );
    }

    await this.ensureDelegated(treasuryPda, "ensureTreasuryPrepared-treasury");
    return treasuryPda;
  }

  private validateUsername(username: string): void {
    if (!username || username.length < 5 || username.length > 32) {
      throw new Error("Username must be between 5 and 32 characters");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error(
        "Username can only contain alphanumeric characters and underscores"
      );
    }
  }

  private async permissionAccountExists(
    permission: PublicKey
  ): Promise<boolean> {
    const info = await this.baseProgram.provider.connection.getAccountInfo(
      permission
    );
    return !!info && info.owner.equals(PERMISSION_PROGRAM_ID);
  }

  private isAccountAlreadyInUse(error: unknown): boolean {
    const message = (error as { message?: string })?.message ?? "";
    if (message.includes("already in use")) {
      return true;
    }
    const logs =
      (error as { logs?: string[]; transactionLogs?: string[] })?.logs ??
      (error as { logs?: string[]; transactionLogs?: string[] })
        ?.transactionLogs;
    if (Array.isArray(logs)) {
      return logs.some((log) => log.includes("already in use"));
    }
    return false;
  }

  private async ensureNotDelegated(
    account: PublicKey,
    name?: string,
    passNotExist?: boolean
  ): Promise<void> {
    const baseAccountInfo =
      await this.baseProgram.provider.connection.getAccountInfo(account);
    const ephemeralAccountInfo =
      await this.ephemeralProgram.provider.connection.getAccountInfo(account);

    if (!baseAccountInfo) {
      if (passNotExist) {
        return;
      }
      const displayName = name ? `${name} - ` : "";
      throw new Error(
        `Account is not exists: ${displayName}${account.toString()}`
      );
    }
    const isDelegated = baseAccountInfo!.owner.equals(DELEGATION_PROGRAM_ID);
    const displayName = name ? `${name} - ` : "";
    if (isDelegated) {
      console.error(
        `Account is delegated to ER: ${displayName}${account.toString()}`
      );
      const delegationStatus = await this.getDelegationStatus(account);
      console.error(
        "/getDelegationStatus",
        JSON.stringify(delegationStatus, null, 2)
      );
      console.error("baseAccountInfo", prettyStringify(baseAccountInfo));
      console.error(
        "ephemeralAccountInfo",
        prettyStringify(ephemeralAccountInfo)
      );

      if (
        delegationStatus.result?.delegationRecord.authority !==
        ER_VALIDATOR.toString()
      ) {
        console.error(
          `Account is delegated on wrong validator: ${displayName}${account.toString()} - validator: ${
            delegationStatus.result?.delegationRecord.authority
          }`
        );
      }

      throw new Error(
        `Account is delegated to ER: ${displayName}${account.toString()}`
      );
    }
  }

  private async ensureDelegated(
    account: PublicKey,
    name?: string,
    skipValidatorCheck?: boolean
  ): Promise<void> {
    const baseAccountInfo =
      await this.baseProgram.provider.connection.getAccountInfo(account);
    const ephemeralAccountInfo =
      await this.ephemeralProgram.provider.connection.getAccountInfo(account);

    if (!baseAccountInfo) {
      const displayName = name ? `${name} - ` : "";
      throw new Error(
        `Account is not exists: ${displayName}${account.toString()}`
      );
    }
    const isDelegated = baseAccountInfo!.owner.equals(DELEGATION_PROGRAM_ID);
    const displayName = name ? `${name} - ` : "";

    const delegationStatus = await this.getDelegationStatus(account);

    if (!isDelegated) {
      console.error(
        `Account is not delegated to ER: ${displayName}${account.toString()}`
      );
      console.error(
        "/getDelegationStatus:",
        JSON.stringify(delegationStatus, null, 2)
      );
      console.error("baseAccountInfo", prettyStringify(baseAccountInfo));
      console.error(
        "ephemeralAccountInfo",
        prettyStringify(ephemeralAccountInfo)
      );

      throw new Error(
        `Account is not delegated to ER: ${displayName}${account.toString()}`
      );
    } else if (
      !skipValidatorCheck &&
      delegationStatus.result?.delegationRecord.authority !==
        ER_VALIDATOR.toString()
    ) {
      console.error(
        `Account is delegated on wrong validator: ${displayName}${account.toString()} - validator: ${
          delegationStatus.result?.delegationRecord.authority
        }`
      );
      console.error(
        "/getDelegationStatus:",
        JSON.stringify(delegationStatus, null, 2)
      );
      console.error("baseAccountInfo", prettyStringify(baseAccountInfo));
      console.error(
        "ephemeralAccountInfo",
        prettyStringify(ephemeralAccountInfo)
      );

      throw new Error(
        `Account is delegated on wrong validator: ${displayName}${account.toString()} - validator: ${
          delegationStatus.result?.delegationRecord.authority
        }`
      );
    }
  }

  private async getDelegationStatus(
    account: PublicKey
  ): Promise<DelegationStatusResponse> {
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getDelegationStatus",
        params: [account.toString()],
      }),
    };
    const res = await fetch(
      "https://devnet-router.magicblock.app/getDelegationStatus",
      options
    );
    return (await res.json()) as DelegationStatusResponse;
  }
}
