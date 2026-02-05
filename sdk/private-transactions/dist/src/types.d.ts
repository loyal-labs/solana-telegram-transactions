import type { PublicKey, Transaction, VersionedTransaction, Keypair, Commitment, ConfirmOptions } from "@solana/web3.js";
import type { AnchorProvider } from "@coral-xyz/anchor";
/**
 * Minimal wallet interface matching @solana/wallet-adapter-base
 * Compatible with browser wallet adapters (Phantom, Solflare, etc.)
 */
export interface WalletLike {
    publicKey: PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
    signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}
/**
 * Union type supporting multiple wallet types:
 * - WalletLike: Browser wallet adapters (Phantom, Solflare, etc.)
 * - Keypair: Server-side scripts and testing
 * - AnchorProvider: Existing Anchor projects
 */
export type WalletSigner = WalletLike | Keypair | AnchorProvider;
export type Amount = number | bigint;
export type SignMessage = (message: Uint8Array) => Promise<Uint8Array>;
export interface EphemeralProviderParams {
    signer: WalletSigner;
    rpcEndpoint?: string;
    wsEndpoint?: string;
    commitment?: Commitment;
    /** Defaults to auto mode when omitted */
    useAuth?: boolean;
    /** Optional pre-fetched auth token */
    authToken?: string;
    /** Optional custom signMessage implementation */
    signMessage?: SignMessage;
}
export interface EphemeralProviderResult {
    provider: AnchorProvider;
    rpcEndpoint: string;
    wsEndpoint: string;
    commitment: Commitment;
    authToken?: string;
    authExpiresAt?: number;
}
export interface RpcOptions {
    /** Transaction commitment level (default: 'confirmed') */
    commitment?: Commitment;
    /** Full RPC confirm options (overrides commitment when provided) */
    rpcOptions?: ConfirmOptions;
}
/**
 * Deposit account data structure
 */
export interface DepositData {
    /** Wallet address of the depositor */
    user: PublicKey;
    /** Token mint for this deposit */
    tokenMint: PublicKey;
    /** Total deposited amount (token base units) */
    amount: number;
    /** PDA address of the deposit account */
    address: PublicKey;
}
/**
 * Username deposit account data structure
 */
export interface UsernameDepositData {
    /** Telegram username */
    username: string;
    /** Token mint for this deposit */
    tokenMint: PublicKey;
    /** Total deposited amount (token base units) */
    amount: number;
    /** PDA address of the username deposit account */
    address: PublicKey;
}
export interface InitializeDepositParams extends RpcOptions {
    tokenMint: PublicKey;
    /** Defaults to connected wallet */
    user?: PublicKey;
    /** Defaults to connected wallet */
    payer?: PublicKey;
    tokenProgram?: PublicKey;
}
export interface InitializeDepositResult {
    signature: string;
    deposit: DepositData;
}
export interface ModifyBalanceParams extends RpcOptions {
    tokenMint: PublicKey;
    amount: Amount;
    increase: boolean;
    /** Defaults to connected wallet */
    user?: PublicKey;
    /** Defaults to connected wallet */
    payer?: PublicKey;
    userTokenAccount?: PublicKey;
    vault?: PublicKey;
    vaultTokenAccount?: PublicKey;
    tokenProgram?: PublicKey;
    associatedTokenProgram?: PublicKey;
}
export interface ModifyBalanceResult {
    signature: string;
    deposit: DepositData;
}
export interface TransferDepositParams extends RpcOptions {
    tokenMint: PublicKey;
    amount: Amount;
    /** Defaults to connected wallet */
    user?: PublicKey;
    destinationUser?: PublicKey;
    sourceDeposit?: PublicKey;
    destinationDeposit?: PublicKey;
    /** Optional session token account for session auth */
    sessionToken?: PublicKey | null;
    /** Defaults to connected wallet */
    payer?: PublicKey;
}
export interface TransferDepositResult {
    signature: string;
    sourceDeposit: DepositData;
    destinationDeposit: DepositData;
}
export interface TransferToUsernameDepositParams extends RpcOptions {
    tokenMint: PublicKey;
    username: string;
    amount: Amount;
    /** Defaults to connected wallet */
    user?: PublicKey;
    sourceDeposit?: PublicKey;
    destinationDeposit?: PublicKey;
    /** Optional session token account for session auth */
    sessionToken?: PublicKey | null;
    /** Defaults to connected wallet */
    payer?: PublicKey;
}
export interface TransferToUsernameDepositResult {
    signature: string;
    sourceDeposit: DepositData;
    destinationDeposit: UsernameDepositData;
}
export interface DepositForUsernameParams extends RpcOptions {
    username: string;
    tokenMint: PublicKey;
    amount: Amount;
    /** Defaults to connected wallet */
    depositor?: PublicKey;
    /** Defaults to connected wallet */
    payer?: PublicKey;
    depositorTokenAccount?: PublicKey;
    vault?: PublicKey;
    vaultTokenAccount?: PublicKey;
    tokenProgram?: PublicKey;
    associatedTokenProgram?: PublicKey;
}
export interface DepositForUsernameResult {
    signature: string;
    deposit: UsernameDepositData;
}
export interface ClaimUsernameDepositParams extends RpcOptions {
    username: string;
    tokenMint: PublicKey;
    amount: Amount;
    /** Defaults to connected wallet */
    recipient?: PublicKey;
    recipientTokenAccount?: PublicKey;
    vault?: PublicKey;
    vaultTokenAccount?: PublicKey;
    session: PublicKey;
    tokenProgram?: PublicKey;
}
export interface ClaimUsernameDepositResult {
    signature: string;
    deposit: UsernameDepositData;
}
export interface CreatePermissionParams extends RpcOptions {
    tokenMint: PublicKey;
    /** Defaults to connected wallet */
    user?: PublicKey;
    /** Defaults to connected wallet */
    payer?: PublicKey;
    deposit?: PublicKey;
    permission?: PublicKey;
    permissionProgram?: PublicKey;
}
export interface CreatePermissionResult {
    signature: string;
    permission: PublicKey;
}
export interface CreateUsernamePermissionParams extends RpcOptions {
    username: string;
    tokenMint: PublicKey;
    session: PublicKey;
    /** Defaults to connected wallet */
    authority?: PublicKey;
    /** Defaults to connected wallet */
    payer?: PublicKey;
    deposit?: PublicKey;
    permission?: PublicKey;
    permissionProgram?: PublicKey;
}
export interface CreateUsernamePermissionResult {
    signature: string;
    permission: PublicKey;
}
export interface DelegateDepositParams extends RpcOptions {
    tokenMint: PublicKey;
    /** Defaults to connected wallet */
    user?: PublicKey;
    /** Defaults to connected wallet */
    payer?: PublicKey;
    deposit?: PublicKey;
    validator?: PublicKey;
}
export interface DelegateUsernameDepositParams extends RpcOptions {
    username: string;
    tokenMint: PublicKey;
    session: PublicKey;
    /** Defaults to connected wallet */
    payer?: PublicKey;
    deposit?: PublicKey;
    validator?: PublicKey;
}
export interface UndelegateDepositParams extends RpcOptions {
    tokenMint: PublicKey;
    /** Defaults to connected wallet */
    user?: PublicKey;
    /** Defaults to connected wallet */
    payer?: PublicKey;
    deposit?: PublicKey;
    /** Optional session token account for session auth */
    sessionToken?: PublicKey | null;
    magicProgram?: PublicKey;
    magicContext?: PublicKey;
}
export interface UndelegateUsernameDepositParams extends RpcOptions {
    username: string;
    tokenMint: PublicKey;
    session: PublicKey;
    /** Defaults to connected wallet */
    payer?: PublicKey;
    deposit?: PublicKey;
    magicProgram?: PublicKey;
    magicContext?: PublicKey;
}
/**
 * Check if signer is a raw Keypair
 */
export declare function isKeypair(signer: WalletSigner): signer is Keypair;
/**
 * Check if signer is an AnchorProvider
 */
export declare function isAnchorProvider(signer: WalletSigner): signer is AnchorProvider;
/**
 * Check if signer is a WalletLike (wallet adapter)
 */
export declare function isWalletLike(signer: WalletSigner): signer is WalletLike;
