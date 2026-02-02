import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { type TelegramPrivateTransfer } from "./idl";
import type { WalletSigner, WalletLike, DepositData, UsernameDepositData, EphemeralProviderParams, EphemeralProviderResult, InitializeDepositParams, InitializeDepositResult, ModifyBalanceParams, ModifyBalanceResult, TransferDepositParams, TransferDepositResult, TransferToUsernameDepositParams, TransferToUsernameDepositResult, DepositForUsernameParams, DepositForUsernameResult, ClaimUsernameDepositParams, ClaimUsernameDepositResult, CreatePermissionParams, CreatePermissionResult, CreateUsernamePermissionParams, CreateUsernamePermissionResult, DelegateDepositParams, DelegateUsernameDepositParams, UndelegateDepositParams, UndelegateUsernameDepositParams } from "./types";
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
export declare class LoyalPrivateTransactionsClient {
    private readonly program;
    private readonly wallet;
    private constructor();
    /**
     * Create client from an AnchorProvider (for existing Anchor projects)
     */
    static fromProvider(provider: AnchorProvider): LoyalPrivateTransactionsClient;
    /**
     * Create client from any supported signer type
     * Automatically detects the signer type and creates the appropriate client
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
     * Build an AnchorProvider targeting the MagicBlock ephemeral RPC.
     * Mirrors the flow used in tests/telegram-private-transfer.ts.
     */
    static createEphemeralProvider(params: EphemeralProviderParams): Promise<EphemeralProviderResult>;
    /**
     * Create a client configured against the MagicBlock ephemeral RPC.
     */
    static fromEphemeral(params: EphemeralProviderParams): Promise<LoyalPrivateTransactionsClient>;
    initializeDeposit(params: InitializeDepositParams): Promise<InitializeDepositResult>;
    modifyBalance(params: ModifyBalanceParams): Promise<ModifyBalanceResult>;
    transferDeposit(params: TransferDepositParams): Promise<TransferDepositResult>;
    transferToUsernameDeposit(params: TransferToUsernameDepositParams): Promise<TransferToUsernameDepositResult>;
    depositForUsername(params: DepositForUsernameParams): Promise<DepositForUsernameResult>;
    claimUsernameDeposit(params: ClaimUsernameDepositParams): Promise<ClaimUsernameDepositResult>;
    createPermission(params: CreatePermissionParams): Promise<CreatePermissionResult>;
    createUsernamePermission(params: CreateUsernamePermissionParams): Promise<CreateUsernamePermissionResult>;
    delegateDeposit(params: DelegateDepositParams): Promise<string>;
    delegateUsernameDeposit(params: DelegateUsernameDepositParams): Promise<string>;
    undelegateDeposit(params: UndelegateDepositParams): Promise<string>;
    undelegateUsernameDeposit(params: UndelegateUsernameDepositParams): Promise<string>;
    getDeposit(user: PublicKey, tokenMint: PublicKey): Promise<DepositData | null>;
    getUsernameDeposit(username: string, tokenMint: PublicKey): Promise<UsernameDepositData | null>;
    findDepositPda(user: PublicKey, tokenMint: PublicKey): [PublicKey, number];
    findUsernameDepositPda(username: string, tokenMint: PublicKey): [PublicKey, number];
    findVaultPda(tokenMint: PublicKey): [PublicKey, number];
    get publicKey(): PublicKey;
    getProgram(): Program<TelegramPrivateTransfer>;
    getProgramId(): PublicKey;
    private static resolveRpcOptions;
    private static toBN;
    private static assertPositiveAmount;
    private static validateUsername;
    private static resolveCommitment;
    private static deriveWsEndpoint;
    private static isLocalEndpoint;
    private static hasToken;
    private static appendToken;
    private static shouldUseEphemeralAuth;
    private static resolveSignMessage;
    private static getEnv;
    private fetchDepositByAddress;
    private fetchUsernameDepositByAddress;
}
