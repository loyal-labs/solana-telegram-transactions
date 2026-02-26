import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { TelegramPrivateTransfer } from "./idl/telegram_private_transfer.ts";
import type { WalletLike, ClientConfig, DepositData, UsernameDepositData, TreasuryData, InitializeDepositParams, ModifyBalanceParams, ModifyBalanceResult, DepositForUsernameParams, ClaimUsernameDepositParams, CreatePermissionParams, CreateUsernamePermissionParams, InitializeTreasuryParams, CreateTreasuryPermissionParams, DelegateDepositParams, DelegateUsernameDepositParams, DelegateTreasuryParams, UndelegateDepositParams, UndelegateUsernameDepositParams, UndelegateTreasuryParams, WithdrawTreasuryFeesParams, TransferDepositParams, TransferToUsernameDepositParams, InitializeUsernameDepositParams, ClaimUsernameDepositToDepositParams } from "./types";
export declare function waitForAccountOwnerChange(connection: Connection, account: PublicKey, expectedOwner: PublicKey, timeoutMs?: number, intervalMs?: number): {
    wait: () => Promise<void>;
    cancel: () => Promise<void>;
};
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
    readonly baseProgram: Program<TelegramPrivateTransfer>;
    readonly ephemeralProgram: Program<TelegramPrivateTransfer>;
    readonly wallet: WalletLike;
    private constructor();
    /**
     * Create client connected to an ephemeral rollup endpoint with PER auth token.
     * Verifies TEE RPC integrity and obtains an auth token automatically.
     */
    static fromConfig(config: ClientConfig): Promise<LoyalPrivateTransactionsClient>;
    /**
     * Initialize a deposit account for a user and token mint
     */
    initializeDeposit(params: InitializeDepositParams): Promise<string>;
    initializeUsernameDeposit(params: InitializeUsernameDepositParams): Promise<string>;
    initializeTreasury(params: InitializeTreasuryParams): Promise<string>;
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
    claimUsernameDepositToDeposit(params: ClaimUsernameDepositToDepositParams): Promise<string>;
    /**
     * Create a permission for a deposit account (required for PER)
     */
    createPermission(params: CreatePermissionParams): Promise<string | null>;
    /**
     * Create a permission for a username-based deposit account
     */
    createUsernamePermission(params: CreateUsernamePermissionParams): Promise<string | null>;
    /**
     * Create a permission for the treasury account
     */
    createTreasuryPermission(params: CreateTreasuryPermissionParams): Promise<string | null>;
    /**
     * Delegate a deposit account to the ephemeral rollup
     */
    delegateDeposit(params: DelegateDepositParams): Promise<string>;
    /**
     * Delegate a username-based deposit account to the ephemeral rollup
     */
    delegateUsernameDeposit(params: DelegateUsernameDepositParams): Promise<string>;
    /**
     * Delegate treasury account to the ephemeral rollup
     */
    delegateTreasury(params: DelegateTreasuryParams): Promise<string>;
    /**
     * Undelegate a deposit account from the ephemeral rollup.
     * Waits for both base and ephemeral connections to confirm the deposit
     * is owned by PROGRAM_ID before returning.
     */
    undelegateDeposit(params: UndelegateDepositParams): Promise<string>;
    /**
     * Undelegate a username-based deposit account from the ephemeral rollup
     */
    undelegateUsernameDeposit(params: UndelegateUsernameDepositParams): Promise<string>;
    /**
     * Undelegate treasury account from the ephemeral rollup
     */
    undelegateTreasury(params: UndelegateTreasuryParams): Promise<string>;
    /**
     * Withdraw accrued transfer fees from treasury.
     */
    withdrawTreasuryFees(params: WithdrawTreasuryFeesParams): Promise<string>;
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
    getBaseDeposit(user: PublicKey, tokenMint: PublicKey): Promise<DepositData | null>;
    getEphemeralDeposit(user: PublicKey, tokenMint: PublicKey): Promise<DepositData | null>;
    /**
     * Get username deposit data
     */
    getBaseUsernameDeposit(username: string, tokenMint: PublicKey): Promise<UsernameDepositData | null>;
    getEphemeralUsernameDeposit(username: string, tokenMint: PublicKey): Promise<UsernameDepositData | null>;
    getBaseTreasury(tokenMint: PublicKey): Promise<TreasuryData | null>;
    getEphemeralTreasury(tokenMint: PublicKey): Promise<TreasuryData | null>;
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
     * Find the treasury PDA
     */
    findTreasuryPda(tokenMint: PublicKey): [PublicKey, number];
    /**
     * Get the connected wallet's public key
     */
    get publicKey(): PublicKey;
    /**
     * Get the underlying Anchor program instance
     */
    getBaseProgram(): Program<TelegramPrivateTransfer>;
    getEphemeralProgram(): Program<TelegramPrivateTransfer>;
    /**
     * Get the program ID
     */
    getProgramId(): PublicKey;
    private ensureTreasuryPrepared;
    private validateUsername;
    private permissionAccountExists;
    private isAccountAlreadyInUse;
    private ensureNotDelegated;
    private ensureDelegated;
    private getDelegationStatus;
}
