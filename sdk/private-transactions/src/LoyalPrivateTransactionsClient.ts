import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  type Commitment,
} from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { IDL, type TelegramPrivateTransfer } from "./idl";
import {
  PROGRAM_ID,
  DELEGATION_PROGRAM_ID,
  PERMISSION_PROGRAM_ID,
  MAGIC_PROGRAM_ID,
  MAGIC_CONTEXT_ID,
} from "./constants";
import {
  findDepositPda,
  findUsernameDepositPda,
  findVaultPda,
  findPermissionPda,
  findDelegationRecordPda,
  findDelegationMetadataPda,
  findBufferPda,
} from "./pda";
import { InternalWalletAdapter } from "./wallet-adapter";
import type {
  WalletSigner,
  WalletLike,
  EphemeralClientConfig,
  DepositData,
  UsernameDepositData,
  InitializeDepositParams,
  ModifyBalanceParams,
  ModifyBalanceResult,
  DepositForUsernameParams,
  ClaimUsernameDepositParams,
  CreatePermissionParams,
  CreateUsernamePermissionParams,
  DelegateDepositParams,
  DelegateUsernameDepositParams,
  UndelegateDepositParams,
  UndelegateUsernameDepositParams,
  TransferDepositParams,
  TransferToUsernameDepositParams,
  RpcOptions,
} from "./types";

/**
 * Create a typed Program instance from the IDL
 */
function createProgram(
  provider: AnchorProvider
): Program<TelegramPrivateTransfer> {
  return new Program(IDL as TelegramPrivateTransfer, provider);
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
  private readonly program: Program<TelegramPrivateTransfer>;
  private readonly wallet: WalletLike;

  private constructor(
    program: Program<TelegramPrivateTransfer>,
    wallet: WalletLike
  ) {
    this.program = program;
    this.wallet = wallet;
  }

  // ============================================================
  // Factory Methods
  // ============================================================

  /**
   * Create client from an AnchorProvider (for existing Anchor projects)
   */
  static fromProvider(
    provider: AnchorProvider
  ): LoyalPrivateTransactionsClient {
    const program = createProgram(provider);
    const wallet = InternalWalletAdapter.from(provider);
    return new LoyalPrivateTransactionsClient(program, wallet);
  }

  /**
   * Create client from any supported signer type
   */
  static from(
    connection: Connection,
    signer: WalletSigner
  ): LoyalPrivateTransactionsClient {
    const adapter = InternalWalletAdapter.from(signer);
    const provider = new AnchorProvider(connection, adapter, {
      commitment: "confirmed",
    });
    const program = createProgram(provider);
    return new LoyalPrivateTransactionsClient(program, adapter);
  }

  /**
   * Create client from a Connection and wallet adapter (for browser dApps)
   */
  static fromWallet(
    connection: Connection,
    wallet: WalletLike
  ): LoyalPrivateTransactionsClient {
    return LoyalPrivateTransactionsClient.from(connection, wallet);
  }

  /**
   * Create client from a Connection and Keypair (for server-side scripts)
   */
  static fromKeypair(
    connection: Connection,
    keypair: Keypair
  ): LoyalPrivateTransactionsClient {
    return LoyalPrivateTransactionsClient.from(connection, keypair);
  }

  /**
   * Create client connected to an ephemeral rollup endpoint
   * Use this for executing transactions on the Private Ephemeral Rollup
   */
  static async fromEphemeral(
    config: EphemeralClientConfig
  ): Promise<LoyalPrivateTransactionsClient> {
    const { signer, rpcEndpoint, wsEndpoint, commitment = "confirmed" } = config;

    const connection = new Connection(rpcEndpoint, {
      wsEndpoint,
      commitment,
    });

    return LoyalPrivateTransactionsClient.from(connection, signer);
  }

  // ============================================================
  // Deposit Operations
  // ============================================================

  /**
   * Initialize a deposit account for a user and token mint
   */
  async initializeDeposit(params: InitializeDepositParams): Promise<string> {
    const { user, tokenMint, payer, rpcOptions } = params;

    const signature = await this.program.methods
      .initializeDeposit()
      .accountsPartial({
        payer,
        user,
        tokenMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.buildRpcOptions(rpcOptions));

    return signature;
  }

  /**
   * Modify the balance of a user's deposit account
   */
  async modifyBalance(params: ModifyBalanceParams): Promise<ModifyBalanceResult> {
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
    const [vaultPda] = findVaultPda(tokenMint);
    const vaultTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      vaultPda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const signature = await this.program.methods
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
      .rpc(this.buildRpcOptions(rpcOptions));

    const deposit = await this.getDeposit(user, tokenMint);
    if (!deposit) {
      throw new Error("Failed to fetch deposit after modification");
    }

    return { signature, deposit };
  }

  /**
   * Deposit tokens for a Telegram username
   */
  async depositForUsername(params: DepositForUsernameParams): Promise<string> {
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
    const [vaultPda] = findVaultPda(tokenMint);
    const vaultTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      vaultPda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const signature = await this.program.methods
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
      .rpc(this.buildRpcOptions(rpcOptions));

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
    const [vaultPda] = findVaultPda(tokenMint);
    const vaultTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      vaultPda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const signature = await this.program.methods
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
      .rpc(this.buildRpcOptions(rpcOptions));

    return signature;
  }

  // ============================================================
  // Permission Operations
  // ============================================================

  /**
   * Create a permission for a deposit account (required for PER)
   */
  async createPermission(params: CreatePermissionParams): Promise<string> {
    const { user, tokenMint, payer, rpcOptions } = params;

    const [depositPda] = findDepositPda(user, tokenMint);
    const [permissionPda] = findPermissionPda(depositPda);

    const signature = await this.program.methods
      .createPermission()
      .accountsPartial({
        payer,
        user,
        deposit: depositPda,
        permission: permissionPda,
        permissionProgram: PERMISSION_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc(this.buildRpcOptions(rpcOptions));

    return signature;
  }

  /**
   * Create a permission for a username-based deposit account
   */
  async createUsernamePermission(
    params: CreateUsernamePermissionParams
  ): Promise<string> {
    const { username, tokenMint, session, authority, payer, rpcOptions } =
      params;

    this.validateUsername(username);

    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    const [permissionPda] = findPermissionPda(depositPda);

    const signature = await this.program.methods
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
      .rpc(this.buildRpcOptions(rpcOptions));

    return signature;
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

    const accounts: Record<string, PublicKey> = {
      payer,
      bufferDeposit: bufferPda,
      delegationRecordDeposit: delegationRecordPda,
      delegationMetadataDeposit: delegationMetadataPda,
      deposit: depositPda,
      ownerProgram: PROGRAM_ID,
      delegationProgram: DELEGATION_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    if (validator) {
      accounts.validator = validator;
    }

    const signature = await this.program.methods
      .delegate(user, tokenMint)
      .accountsPartial(accounts)
      .rpc(this.buildRpcOptions(rpcOptions));

    return signature;
  }

  /**
   * Delegate a username-based deposit account to the ephemeral rollup
   */
  async delegateUsernameDeposit(
    params: DelegateUsernameDepositParams
  ): Promise<string> {
    const { username, tokenMint, session, payer, validator, rpcOptions } =
      params;

    this.validateUsername(username);

    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    const [bufferPda] = findBufferPda(depositPda);
    const [delegationRecordPda] = findDelegationRecordPda(depositPda);
    const [delegationMetadataPda] = findDelegationMetadataPda(depositPda);

    const accounts: Record<string, PublicKey> = {
      payer,
      session,
      bufferDeposit: bufferPda,
      delegationRecordDeposit: delegationRecordPda,
      delegationMetadataDeposit: delegationMetadataPda,
      deposit: depositPda,
      ownerProgram: PROGRAM_ID,
      delegationProgram: DELEGATION_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };

    if (validator) {
      accounts.validator = validator;
    }

    const signature = await this.program.methods
      .delegateUsernameDeposit(username, tokenMint)
      .accountsPartial(accounts)
      .rpc(this.buildRpcOptions(rpcOptions));

    return signature;
  }

  /**
   * Undelegate a deposit account from the ephemeral rollup
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

    const accounts: Record<string, PublicKey | null> = {
      user,
      payer,
      deposit: depositPda,
      magicProgram,
      magicContext,
    };

    if (sessionToken !== undefined) {
      accounts.sessionToken = sessionToken;
    }

    const signature = await this.program.methods
      .undelegate()
      .accountsPartial(accounts)
      .rpc(this.buildRpcOptions(rpcOptions));

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

    const signature = await this.program.methods
      .undelegateUsernameDeposit(username, tokenMint)
      .accountsPartial({
        payer,
        session,
        deposit: depositPda,
        magicProgram,
        magicContext,
      })
      .rpc(this.buildRpcOptions(rpcOptions));

    return signature;
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

    const accounts: Record<string, PublicKey | null> = {
      user,
      payer,
      sourceDeposit: sourceDepositPda,
      destinationDeposit: destinationDepositPda,
      tokenMint,
      systemProgram: SystemProgram.programId,
    };

    if (sessionToken !== undefined) {
      accounts.sessionToken = sessionToken;
    }

    const signature = await this.program.methods
      .transferDeposit(new BN(amount.toString()))
      .accountsPartial(accounts)
      .rpc(this.buildRpcOptions(rpcOptions));

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

    const accounts: Record<string, PublicKey | null> = {
      user,
      payer,
      sourceDeposit: sourceDepositPda,
      destinationDeposit: destinationDepositPda,
      tokenMint,
      systemProgram: SystemProgram.programId,
    };

    if (sessionToken !== undefined) {
      accounts.sessionToken = sessionToken;
    }

    const signature = await this.program.methods
      .transferToUsernameDeposit(new BN(amount.toString()))
      .accountsPartial(accounts)
      .rpc(this.buildRpcOptions(rpcOptions));

    return signature;
  }

  // ============================================================
  // Query Methods
  // ============================================================

  /**
   * Get deposit data for a user and token mint
   */
  async getDeposit(
    user: PublicKey,
    tokenMint: PublicKey
  ): Promise<DepositData | null> {
    const [depositPda] = findDepositPda(user, tokenMint);

    try {
      const account = await this.program.account.deposit.fetch(depositPda);
      return {
        user: account.user,
        tokenMint: account.tokenMint,
        amount: account.amount.toNumber(),
        address: depositPda,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get username deposit data
   */
  async getUsernameDeposit(
    username: string,
    tokenMint: PublicKey
  ): Promise<UsernameDepositData | null> {
    const [depositPda] = findUsernameDepositPda(username, tokenMint);

    try {
      const account =
        await this.program.account.usernameDeposit.fetch(depositPda);
      return {
        username: account.username,
        tokenMint: account.tokenMint,
        amount: account.amount.toNumber(),
        address: depositPda,
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
  findDepositPda(
    user: PublicKey,
    tokenMint: PublicKey
  ): [PublicKey, number] {
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
  getProgram(): Program<TelegramPrivateTransfer> {
    return this.program;
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

  private buildRpcOptions(options?: RpcOptions): {
    skipPreflight?: boolean;
    preflightCommitment?: Commitment;
    maxRetries?: number;
  } {
    return {
      skipPreflight: options?.skipPreflight,
      preflightCommitment: options?.preflightCommitment,
      maxRetries: options?.maxRetries,
    };
  }
}
