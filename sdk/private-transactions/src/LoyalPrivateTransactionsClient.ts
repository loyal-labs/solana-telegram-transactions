import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import type { Commitment, ConfirmOptions } from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
  PERMISSION_PROGRAM_ID,
  getAuthToken,
  permissionPdaFromAccount,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import { sign } from "tweetnacl";
import { IDL, type TelegramPrivateTransfer } from "./idl";
import { PROGRAM_ID } from "./constants";
import {
  findDepositPda,
  findUsernameDepositPda,
  findVaultPda,
} from "./pda";
import { InternalWalletAdapter } from "./wallet-adapter";
import { isAnchorProvider, isKeypair } from "./types";
import type {
  WalletSigner,
  WalletLike,
  Amount,
  SignMessage,
  DepositData,
  UsernameDepositData,
  EphemeralProviderParams,
  EphemeralProviderResult,
  InitializeDepositParams,
  InitializeDepositResult,
  ModifyBalanceParams,
  ModifyBalanceResult,
  TransferDepositParams,
  TransferDepositResult,
  TransferToUsernameDepositParams,
  TransferToUsernameDepositResult,
  DepositForUsernameParams,
  DepositForUsernameResult,
  ClaimUsernameDepositParams,
  ClaimUsernameDepositResult,
  CreatePermissionParams,
  CreatePermissionResult,
  CreateUsernamePermissionParams,
  CreateUsernamePermissionResult,
  DelegateDepositParams,
  DelegateUsernameDepositParams,
  UndelegateDepositParams,
  UndelegateUsernameDepositParams,
} from "./types";

const USERNAME_REGEX = /^[A-Za-z0-9_]{5,32}$/;

/**
 * Create a typed Program instance from the IDL
 */
function createProgram(provider: AnchorProvider): Program<TelegramPrivateTransfer> {
  return new Program(IDL as TelegramPrivateTransfer, provider);
}

/**
 * LoyalPrivateTransactionsClient - SDK for interacting with the Telegram Private Transfer program
 *
 * @example
 * // Browser with wallet adapter
 * const client = LoyalPrivateTransactionsClient.fromWallet(connection, walletAdapter);
 *
 * @example
 * // Server-side with keypair
 * const client = LoyalPrivateTransactionsClient.fromKeypair(connection, keypair);
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
   * Automatically detects the signer type and creates the appropriate client
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
   * Build an AnchorProvider targeting the MagicBlock ephemeral RPC.
   * Mirrors the flow used in tests/telegram-private-transfer.ts.
   */
  static async createEphemeralProvider(
    params: EphemeralProviderParams
  ): Promise<EphemeralProviderResult> {
    const {
      signer,
      rpcEndpoint,
      wsEndpoint,
      commitment,
      useAuth,
      authToken,
      signMessage,
    } = params;

    const resolvedRpc =
      rpcEndpoint ??
      LoyalPrivateTransactionsClient.getEnv("EPHEMERAL_PROVIDER_ENDPOINT") ??
      "http://127.0.0.1:7799";
    const resolvedWs =
      wsEndpoint ??
      LoyalPrivateTransactionsClient.getEnv("EPHEMERAL_WS_ENDPOINT") ??
      (LoyalPrivateTransactionsClient.isLocalEndpoint(resolvedRpc)
        ? "ws://127.0.0.1:7800"
        : LoyalPrivateTransactionsClient.deriveWsEndpoint(resolvedRpc));
    const resolvedCommitment = LoyalPrivateTransactionsClient.resolveCommitment(
      commitment
    );

    const hasTokenInUrl =
      LoyalPrivateTransactionsClient.hasToken(resolvedRpc) ||
      LoyalPrivateTransactionsClient.hasToken(resolvedWs);
    const hasAuthToken = hasTokenInUrl || Boolean(authToken);
    const shouldUseAuth = LoyalPrivateTransactionsClient.shouldUseEphemeralAuth(
      useAuth,
      hasTokenInUrl,
      resolvedRpc
    );

    let finalRpc = resolvedRpc;
    let finalWs = resolvedWs;
    let authResult: { token: string; expiresAt: number } | undefined;

    if (authToken && !hasTokenInUrl) {
      finalRpc = LoyalPrivateTransactionsClient.appendToken(
        finalRpc,
        authToken
      );
      finalWs = LoyalPrivateTransactionsClient.appendToken(
        finalWs,
        authToken
      );
    } else if (!hasAuthToken && shouldUseAuth) {
      const signerFn = LoyalPrivateTransactionsClient.resolveSignMessage(
        signer,
        signMessage
      );
      if (!signerFn) {
        throw new Error(
          "signMessage is required to fetch MagicBlock auth token. Provide signMessage or authToken."
        );
      }
      authResult = await getAuthToken(
        resolvedRpc,
        InternalWalletAdapter.getPublicKey(signer),
        signerFn
      );
      finalRpc = LoyalPrivateTransactionsClient.appendToken(
        finalRpc,
        authResult.token
      );
      finalWs = LoyalPrivateTransactionsClient.appendToken(
        finalWs,
        authResult.token
      );
    }

    const connection = new Connection(finalRpc, {
      wsEndpoint: finalWs,
      commitment: resolvedCommitment,
    });
    const provider = new AnchorProvider(
      connection,
      InternalWalletAdapter.from(signer),
      {
        commitment: resolvedCommitment,
        preflightCommitment: resolvedCommitment,
      }
    );

    return {
      provider,
      rpcEndpoint: finalRpc,
      wsEndpoint: finalWs,
      commitment: resolvedCommitment,
      authToken: authResult?.token ?? authToken,
      authExpiresAt: authResult?.expiresAt,
    };
  }

  /**
   * Create a client configured against the MagicBlock ephemeral RPC.
   */
  static async fromEphemeral(
    params: EphemeralProviderParams
  ): Promise<LoyalPrivateTransactionsClient> {
    const { provider } =
      await LoyalPrivateTransactionsClient.createEphemeralProvider(params);
    return LoyalPrivateTransactionsClient.fromProvider(provider);
  }

  // ============================================================
  // Transaction Methods
  // ============================================================

  async initializeDeposit(
    params: InitializeDepositParams
  ): Promise<InitializeDepositResult> {
    const {
      tokenMint,
      user = this.wallet.publicKey,
      payer = this.wallet.publicKey,
      tokenProgram = TOKEN_PROGRAM_ID,
      commitment,
      rpcOptions,
    } = params;

    const [depositPda] = findDepositPda(user, tokenMint);
    const signature = await this.program.methods
      .initializeDeposit()
      .accountsPartial({
        payer,
        user,
        deposit: depositPda,
        tokenMint,
        tokenProgram,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));

    const deposit = await this.getDeposit(user, tokenMint);
    if (!deposit) {
      throw new Error("Failed to fetch deposit account after transaction");
    }

    return { signature, deposit };
  }

  async modifyBalance(
    params: ModifyBalanceParams
  ): Promise<ModifyBalanceResult> {
    const {
      tokenMint,
      amount,
      increase,
      user = this.wallet.publicKey,
      payer = this.wallet.publicKey,
      userTokenAccount,
      vault,
      vaultTokenAccount,
      tokenProgram = TOKEN_PROGRAM_ID,
      associatedTokenProgram = ASSOCIATED_TOKEN_PROGRAM_ID,
      commitment,
      rpcOptions,
    } = params;

    LoyalPrivateTransactionsClient.assertPositiveAmount(amount);

    const [depositPda] = findDepositPda(user, tokenMint);
    const [vaultPda] = vault ? [vault] : findVaultPda(tokenMint);
    const userAta =
      userTokenAccount ??
      getAssociatedTokenAddressSync(
        tokenMint,
        user,
        false,
        tokenProgram,
        associatedTokenProgram
      );
    const vaultAta =
      vaultTokenAccount ??
      getAssociatedTokenAddressSync(
        tokenMint,
        vaultPda,
        true,
        tokenProgram,
        associatedTokenProgram
      );

    const signature = await this.program.methods
      .modifyBalance({
        amount: LoyalPrivateTransactionsClient.toBN(amount),
        increase,
      })
      .accountsPartial({
        payer,
        user,
        deposit: depositPda,
        vault: vaultPda,
        userTokenAccount: userAta,
        vaultTokenAccount: vaultAta,
        tokenMint,
        tokenProgram,
        associatedTokenProgram,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));

    const deposit = await this.getDeposit(user, tokenMint);
    if (!deposit) {
      throw new Error("Failed to fetch deposit account after transaction");
    }

    return { signature, deposit };
  }

  async transferDeposit(
    params: TransferDepositParams
  ): Promise<TransferDepositResult> {
    const {
      tokenMint,
      amount,
      user = this.wallet.publicKey,
      destinationUser,
      sourceDeposit,
      destinationDeposit,
      sessionToken = null,
      payer = this.wallet.publicKey,
      commitment,
      rpcOptions,
    } = params;

    if (!destinationUser && !destinationDeposit) {
      throw new Error("Destination user or deposit is required");
    }
    LoyalPrivateTransactionsClient.assertPositiveAmount(amount);

    const [sourcePda] = sourceDeposit
      ? [sourceDeposit]
      : findDepositPda(user, tokenMint);
    const [destinationPda] = destinationDeposit
      ? [destinationDeposit]
      : findDepositPda(destinationUser as PublicKey, tokenMint);

    const signature = await this.program.methods
      .transferDeposit(LoyalPrivateTransactionsClient.toBN(amount))
      .accountsPartial({
        user,
        payer,
        sessionToken,
        sourceDeposit: sourcePda,
        destinationDeposit: destinationPda,
        tokenMint,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));

    const source = await this.fetchDepositByAddress(sourcePda);
    const destination = await this.fetchDepositByAddress(destinationPda);

    if (!source || !destination) {
      throw new Error("Failed to fetch deposit accounts after transaction");
    }

    return { signature, sourceDeposit: source, destinationDeposit: destination };
  }

  async transferToUsernameDeposit(
    params: TransferToUsernameDepositParams
  ): Promise<TransferToUsernameDepositResult> {
    const {
      tokenMint,
      username,
      amount,
      user = this.wallet.publicKey,
      sourceDeposit,
      destinationDeposit,
      sessionToken = null,
      payer = this.wallet.publicKey,
      commitment,
      rpcOptions,
    } = params;

    LoyalPrivateTransactionsClient.validateUsername(username);
    LoyalPrivateTransactionsClient.assertPositiveAmount(amount);

    const [sourcePda] = sourceDeposit
      ? [sourceDeposit]
      : findDepositPda(user, tokenMint);
    const [destinationPda] = destinationDeposit
      ? [destinationDeposit]
      : findUsernameDepositPda(username, tokenMint);

    const signature = await this.program.methods
      .transferToUsernameDeposit(LoyalPrivateTransactionsClient.toBN(amount))
      .accountsPartial({
        user,
        payer,
        sessionToken,
        sourceDeposit: sourcePda,
        destinationDeposit: destinationPda,
        tokenMint,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));

    const source = await this.fetchDepositByAddress(sourcePda);
    const destination = await this.fetchUsernameDepositByAddress(destinationPda);

    if (!source || !destination) {
      throw new Error("Failed to fetch deposit accounts after transaction");
    }

    return { signature, sourceDeposit: source, destinationDeposit: destination };
  }

  async depositForUsername(
    params: DepositForUsernameParams
  ): Promise<DepositForUsernameResult> {
    const {
      username,
      tokenMint,
      amount,
      depositor = this.wallet.publicKey,
      payer = this.wallet.publicKey,
      depositorTokenAccount,
      vault,
      vaultTokenAccount,
      tokenProgram = TOKEN_PROGRAM_ID,
      associatedTokenProgram = ASSOCIATED_TOKEN_PROGRAM_ID,
      commitment,
      rpcOptions,
    } = params;

    LoyalPrivateTransactionsClient.validateUsername(username);
    LoyalPrivateTransactionsClient.assertPositiveAmount(amount);

    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    const [vaultPda] = vault ? [vault] : findVaultPda(tokenMint);
    const depositorAta =
      depositorTokenAccount ??
      getAssociatedTokenAddressSync(
        tokenMint,
        depositor,
        false,
        tokenProgram,
        associatedTokenProgram
      );
    const vaultAta =
      vaultTokenAccount ??
      getAssociatedTokenAddressSync(
        tokenMint,
        vaultPda,
        true,
        tokenProgram,
        associatedTokenProgram
      );

    const signature = await this.program.methods
      .depositForUsername(username, LoyalPrivateTransactionsClient.toBN(amount))
      .accountsPartial({
        payer,
        depositor,
        deposit: depositPda,
        vault: vaultPda,
        vaultTokenAccount: vaultAta,
        depositorTokenAccount: depositorAta,
        tokenMint,
        tokenProgram,
        associatedTokenProgram,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));

    const deposit = await this.getUsernameDeposit(username, tokenMint);
    if (!deposit) {
      throw new Error("Failed to fetch username deposit after transaction");
    }

    return { signature, deposit };
  }

  async claimUsernameDeposit(
    params: ClaimUsernameDepositParams
  ): Promise<ClaimUsernameDepositResult> {
    const {
      username,
      tokenMint,
      amount,
      recipient = this.wallet.publicKey,
      recipientTokenAccount,
      vault,
      vaultTokenAccount,
      session,
      tokenProgram = TOKEN_PROGRAM_ID,
      commitment,
      rpcOptions,
    } = params;

    LoyalPrivateTransactionsClient.validateUsername(username);
    LoyalPrivateTransactionsClient.assertPositiveAmount(amount);

    const [depositPda] = findUsernameDepositPda(username, tokenMint);
    const [vaultPda] = vault ? [vault] : findVaultPda(tokenMint);
    const recipientAta =
      recipientTokenAccount ??
      getAssociatedTokenAddressSync(tokenMint, recipient, false, tokenProgram);
    const vaultAta =
      vaultTokenAccount ??
      getAssociatedTokenAddressSync(tokenMint, vaultPda, true, tokenProgram);

    const signature = await this.program.methods
      .claimUsernameDeposit(LoyalPrivateTransactionsClient.toBN(amount))
      .accountsPartial({
        recipientTokenAccount: recipientAta,
        vault: vaultPda,
        vaultTokenAccount: vaultAta,
        deposit: depositPda,
        tokenMint,
        session,
        tokenProgram,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));

    const deposit = await this.getUsernameDeposit(username, tokenMint);
    if (!deposit) {
      throw new Error("Failed to fetch username deposit after transaction");
    }

    return { signature, deposit };
  }

  async createPermission(
    params: CreatePermissionParams
  ): Promise<CreatePermissionResult> {
    const {
      tokenMint,
      user = this.wallet.publicKey,
      payer = this.wallet.publicKey,
      deposit,
      permission,
      permissionProgram = PERMISSION_PROGRAM_ID,
      commitment,
      rpcOptions,
    } = params;

    const [depositPda] = deposit ? [deposit] : findDepositPda(user, tokenMint);
    const permissionPda =
      permission ?? permissionPdaFromAccount(depositPda);

    const signature = await this.program.methods
      .createPermission()
      .accountsPartial({
        payer,
        user,
        deposit: depositPda,
        permission: permissionPda,
        permissionProgram,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));

    return { signature, permission: permissionPda };
  }

  async createUsernamePermission(
    params: CreateUsernamePermissionParams
  ): Promise<CreateUsernamePermissionResult> {
    const {
      username,
      tokenMint,
      session,
      authority = this.wallet.publicKey,
      payer = this.wallet.publicKey,
      deposit,
      permission,
      permissionProgram = PERMISSION_PROGRAM_ID,
      commitment,
      rpcOptions,
    } = params;

    LoyalPrivateTransactionsClient.validateUsername(username);

    const [depositPda] = deposit
      ? [deposit]
      : findUsernameDepositPda(username, tokenMint);
    const permissionPda =
      permission ?? permissionPdaFromAccount(depositPda);

    const signature = await this.program.methods
      .createUsernamePermission()
      .accountsPartial({
        payer,
        authority,
        session,
        deposit: depositPda,
        permission: permissionPda,
        permissionProgram,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));

    return { signature, permission: permissionPda };
  }

  async delegateDeposit(params: DelegateDepositParams): Promise<string> {
    const {
      tokenMint,
      user = this.wallet.publicKey,
      payer = this.wallet.publicKey,
      deposit,
      validator,
      commitment,
      rpcOptions,
    } = params;

    const [depositPda] = deposit ? [deposit] : findDepositPda(user, tokenMint);

    return this.program.methods
      .delegate(user, tokenMint)
      .accountsPartial({
        payer,
        deposit: depositPda,
        validator: validator ?? null,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));
  }

  async delegateUsernameDeposit(
    params: DelegateUsernameDepositParams
  ): Promise<string> {
    const {
      username,
      tokenMint,
      session,
      payer = this.wallet.publicKey,
      deposit,
      validator,
      commitment,
      rpcOptions,
    } = params;

    LoyalPrivateTransactionsClient.validateUsername(username);

    const [depositPda] = deposit
      ? [deposit]
      : findUsernameDepositPda(username, tokenMint);

    return this.program.methods
      .delegateUsernameDeposit(username, tokenMint)
      .accountsPartial({
        payer,
        session,
        deposit: depositPda,
        validator: validator ?? null,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));
  }

  async undelegateDeposit(params: UndelegateDepositParams): Promise<string> {
    const {
      tokenMint,
      user = this.wallet.publicKey,
      payer = this.wallet.publicKey,
      deposit,
      sessionToken = null,
      magicProgram = MAGIC_PROGRAM_ID,
      magicContext = MAGIC_CONTEXT_ID,
      commitment,
      rpcOptions,
    } = params;

    const [depositPda] = deposit ? [deposit] : findDepositPda(user, tokenMint);

    return this.program.methods
      .undelegate()
      .accountsPartial({
        user,
        payer,
        sessionToken,
        deposit: depositPda,
        magicProgram,
        magicContext,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));
  }

  async undelegateUsernameDeposit(
    params: UndelegateUsernameDepositParams
  ): Promise<string> {
    const {
      username,
      tokenMint,
      session,
      payer = this.wallet.publicKey,
      deposit,
      magicProgram = MAGIC_PROGRAM_ID,
      magicContext = MAGIC_CONTEXT_ID,
      commitment,
      rpcOptions,
    } = params;

    LoyalPrivateTransactionsClient.validateUsername(username);

    const [depositPda] = deposit
      ? [deposit]
      : findUsernameDepositPda(username, tokenMint);

    return this.program.methods
      .undelegateUsernameDeposit(username, tokenMint)
      .accountsPartial({
        payer,
        session,
        deposit: depositPda,
        magicProgram,
        magicContext,
      })
      .rpc(LoyalPrivateTransactionsClient.resolveRpcOptions(commitment, rpcOptions));
  }

  // ============================================================
  // Query Methods
  // ============================================================

  async getDeposit(
    user: PublicKey,
    tokenMint: PublicKey
  ): Promise<DepositData | null> {
    const [depositPda] = findDepositPda(user, tokenMint);

    return this.fetchDepositByAddress(depositPda);
  }

  async getUsernameDeposit(
    username: string,
    tokenMint: PublicKey
  ): Promise<UsernameDepositData | null> {
    const [depositPda] = findUsernameDepositPda(username, tokenMint);

    return this.fetchUsernameDepositByAddress(depositPda);
  }

  // ============================================================
  // PDA Helpers
  // ============================================================

  findDepositPda(user: PublicKey, tokenMint: PublicKey): [PublicKey, number] {
    return findDepositPda(user, tokenMint, PROGRAM_ID);
  }

  findUsernameDepositPda(
    username: string,
    tokenMint: PublicKey
  ): [PublicKey, number] {
    return findUsernameDepositPda(username, tokenMint, PROGRAM_ID);
  }

  findVaultPda(tokenMint: PublicKey): [PublicKey, number] {
    return findVaultPda(tokenMint, PROGRAM_ID);
  }

  // ============================================================
  // Accessors
  // ============================================================

  get publicKey(): PublicKey {
    return this.wallet.publicKey;
  }

  getProgram(): Program<TelegramPrivateTransfer> {
    return this.program;
  }

  getProgramId(): PublicKey {
    return PROGRAM_ID;
  }

  // ============================================================
  // Helpers
  // ============================================================

  private static resolveRpcOptions(
    commitment?: Commitment,
    rpcOptions?: ConfirmOptions
  ): ConfirmOptions {
    const options: ConfirmOptions = {
      commitment: commitment ?? rpcOptions?.commitment ?? "confirmed",
    };
    if (rpcOptions) {
      Object.assign(options, rpcOptions);
    }
    if (commitment) {
      options.commitment = commitment;
    }
    return options;
  }

  private static toBN(amount: Amount): BN {
    if (typeof amount === "bigint") {
      return new BN(amount.toString());
    }
    return new BN(amount.toString());
  }

  private static assertPositiveAmount(amount: Amount): void {
    if (typeof amount === "bigint") {
      if (amount <= 0n) {
        throw new Error("Amount must be greater than 0");
      }
      return;
    }
    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }
  }

  private static validateUsername(username: string): void {
    if (!USERNAME_REGEX.test(username)) {
      throw new Error(
        "Username must be 5-32 characters and contain only letters, numbers, or underscores"
      );
    }
  }

  private static resolveCommitment(commitment?: Commitment): Commitment {
    const envCommitment =
      (LoyalPrivateTransactionsClient.getEnv("PROVIDER_COMMITMENT") as
        | Commitment
        | undefined) ??
      (LoyalPrivateTransactionsClient.getEnv("COMMITMENT") as
        | Commitment
        | undefined);
    return commitment ?? envCommitment ?? "confirmed";
  }

  private static deriveWsEndpoint(rpcEndpoint: string): string {
    return rpcEndpoint.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  }

  private static isLocalEndpoint(rpcEndpoint: string): boolean {
    return (
      rpcEndpoint.includes("localhost") || rpcEndpoint.includes("127.0.0.1")
    );
  }

  private static hasToken(endpoint: string): boolean {
    return endpoint.includes("token=");
  }

  private static appendToken(endpoint: string, token: string): string {
    return endpoint.includes("?")
      ? `${endpoint}&token=${token}`
      : `${endpoint}?token=${token}`;
  }

  private static shouldUseEphemeralAuth(
    useAuth: boolean | undefined,
    hasToken: boolean,
    rpcEndpoint: string
  ): boolean {
    if (typeof useAuth === "boolean") {
      return useAuth;
    }
    const envAuth =
      LoyalPrivateTransactionsClient.getEnv("EPHEMERAL_AUTH") === "true";
    return (
      envAuth ||
      (!hasToken &&
        (rpcEndpoint.includes("tee.magicblock.app") ||
          rpcEndpoint.includes("magicblock.app")))
    );
  }

  private static resolveSignMessage(
    signer: WalletSigner,
    override?: SignMessage
  ): SignMessage | null {
    if (override) {
      return override;
    }
    if (isKeypair(signer)) {
      return async (message) => sign.detached(message, signer.secretKey);
    }
    if (isAnchorProvider(signer)) {
      const wallet = signer.wallet as WalletLike & {
        signMessage?: SignMessage;
      };
      if (typeof wallet.signMessage === "function") {
        return (message) => wallet.signMessage!(message);
      }
      return null;
    }
    const wallet = signer as WalletLike & { signMessage?: SignMessage };
    if (typeof wallet.signMessage === "function") {
      return (message) => wallet.signMessage!(message);
    }
    return null;
  }

  private static getEnv(key: string): string | undefined {
    if (typeof process === "undefined" || !process.env) {
      return undefined;
    }
    return process.env[key];
  }

  private async fetchDepositByAddress(
    address: PublicKey
  ): Promise<DepositData | null> {
    try {
      const account = await this.program.account.deposit.fetch(address);
      return {
        user: account.user,
        tokenMint: account.tokenMint,
        amount: account.amount.toNumber(),
        address,
      };
    } catch {
      return null;
    }
  }

  private async fetchUsernameDepositByAddress(
    address: PublicKey
  ): Promise<UsernameDepositData | null> {
    try {
      const account = await this.program.account.usernameDeposit.fetch(address);
      return {
        username: account.username,
        tokenMint: account.tokenMint,
        amount: account.amount.toNumber(),
        address,
      };
    } catch {
      return null;
    }
  }
}
