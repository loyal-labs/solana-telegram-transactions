import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { type TelegramPrivateTransfer } from "./idl";
import type { WalletSigner, WalletLike, EphemeralClientConfig, DepositData, UsernameDepositData, InitializeDepositParams, ModifyBalanceParams, ModifyBalanceResult, DepositForUsernameParams, ClaimUsernameDepositParams, CreatePermissionParams, CreateUsernamePermissionParams, DelegateDepositParams, DelegateUsernameDepositParams, UndelegateDepositParams, UndelegateUsernameDepositParams, TransferDepositParams, TransferToUsernameDepositParams } from "./types";
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
export declare class LoyalPrivateTransactionsClient {
    readonly program: Program<TelegramPrivateTransfer>;
    readonly wallet: WalletLike;
    readonly authToken?: string;
    readonly authTokenExpiresAt?: number;
    private constructor();
    /**
     * Create client from an AnchorProvider (for existing Anchor projects)
     */
    static fromProvider(provider: AnchorProvider): LoyalPrivateTransactionsClient;
    /**
     * Create client from any supported signer type
     */
    static from(connection: Connection, signer: WalletSigner): LoyalPrivateTransactionsClient;
    /**
     * Create client from a Connection and wallet adapter (for browser dApps)
     */
    static fromWallet(connection: Connection, wallet: WalletLike): LoyalPrivateTransactionsClient;
    /**
     * Create client from a Connection and Keypair (for server-side scripts)
     */
    static fromKeypair(connection: Connection, keypair: Keypair): LoyalPrivateTransactionsClient;
    /**
     * Create client connected to an ephemeral rollup endpoint with PER auth token.
     * Verifies TEE RPC integrity and obtains an auth token automatically.
     */
    static fromEphemeral(config: EphemeralClientConfig): Promise<LoyalPrivateTransactionsClient>;
    /**
     * Initialize a deposit account for a user and token mint
     */
    initializeDeposit(params: InitializeDepositParams): Promise<string>;
    /**
     * Modify the balance of a user's deposit account
     */
    modifyBalance(params: ModifyBalanceParams): Promise<ModifyBalanceResult>;
    /**
     * Deposit tokens for a Telegram username
     */
    depositForUsername(params: DepositForUsernameParams): Promise<string>;
    /**
     * Claim tokens from a username-based deposit
     */
    claimUsernameDeposit(params: ClaimUsernameDepositParams): Promise<string>;
    /**
     * Create a permission for a deposit account (required for PER)
     */
    createPermission(params: CreatePermissionParams): Promise<string>;
    /**
     * Create a permission for a username-based deposit account
     */
    createUsernamePermission(params: CreateUsernamePermissionParams): Promise<string>;
    /**
     * Delegate a deposit account to the ephemeral rollup
     */
    delegateDeposit(params: DelegateDepositParams): Promise<string>;
    /**
     * Delegate a username-based deposit account to the ephemeral rollup
     */
    delegateUsernameDeposit(params: DelegateUsernameDepositParams): Promise<string>;
    /**
     * Undelegate a deposit account from the ephemeral rollup
     */
    undelegateDeposit(params: UndelegateDepositParams): Promise<string>;
    /**
     * Undelegate a username-based deposit account from the ephemeral rollup
     */
    undelegateUsernameDeposit(params: UndelegateUsernameDepositParams): Promise<string>;
    /**
     * Transfer between two user deposits
     */
    transferDeposit(params: TransferDepositParams): Promise<string>;
    /**
     * Transfer from a user deposit to a username deposit
     */
    transferToUsernameDeposit(params: TransferToUsernameDepositParams): Promise<string>;
    /**
     * Get deposit data for a user and token mint
     */
    getDeposit(user: PublicKey, tokenMint: PublicKey): Promise<DepositData | null>;
    /**
     * Get username deposit data
     */
    getUsernameDeposit(username: string, tokenMint: PublicKey): Promise<UsernameDepositData | null>;
    /**
     * Find the deposit PDA for a user and token mint
     */
    findDepositPda(user: PublicKey, tokenMint: PublicKey): [PublicKey, number];
    /**
     * Find the username deposit PDA
     */
    findUsernameDepositPda(username: string, tokenMint: PublicKey): [PublicKey, number];
    /**
     * Find the vault PDA
     */
    findVaultPda(tokenMint: PublicKey): [PublicKey, number];
    /**
     * Get the connected wallet's public key
     */
    get publicKey(): PublicKey;
    /**
     * Get the underlying Anchor program instance
     */
    getProgram(): Program<TelegramPrivateTransfer>;
    /**
     * Get the program ID
     */
    getProgramId(): PublicKey;
    private validateUsername;
    private buildRpcOptions;
    private permissionAccountExists;
    private isAccountAlreadyInUse;
}
