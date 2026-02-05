import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { type TelegramTransfer } from "./idl";
import type { WalletSigner, WalletLike, DepositParams, DepositResult, RefundParams, RefundResult, DepositData } from "./types";
/**
 * LoyalTransactionsClient - SDK for interacting with the Telegram Transfer program
 *
 * @example
 * // Browser with wallet adapter
 * const client = LoyalTransactionsClient.fromWallet(connection, walletAdapter);
 *
 * // Server-side with keypair
 * const client = LoyalTransactionsClient.fromKeypair(connection, keypair);
 *
 * // Existing Anchor project
 * const client = LoyalTransactionsClient.fromProvider(provider);
 *
 * // Deposit SOL for a username
 * const result = await client.deposit({
 *   username: 'alice',
 *   amountLamports: 100_000_000, // 0.1 SOL
 * });
 */
export declare class LoyalTransactionsClient {
    private readonly program;
    private readonly wallet;
    private constructor();
    /**
     * Create client from an AnchorProvider (for existing Anchor projects)
     *
     * @example
     * const provider = AnchorProvider.env();
     * const client = LoyalTransactionsClient.fromProvider(provider);
     */
    static fromProvider(provider: AnchorProvider): LoyalTransactionsClient;
    /**
     * Create client from any supported signer type
     * Automatically detects the signer type and creates the appropriate client
     *
     * @example
     * // Works with any signer type
     * const client = LoyalTransactionsClient.from(connection, signer);
     */
    static from(connection: Connection, signer: WalletSigner): LoyalTransactionsClient;
    /**
     * Create client from a Connection and wallet adapter (for browser dApps)
     *
     * @example
     * import { useConnection, useWallet } from '@solana/wallet-adapter-react';
     *
     * const { connection } = useConnection();
     * const wallet = useWallet();
     * const client = LoyalTransactionsClient.fromWallet(connection, wallet);
     */
    static fromWallet(connection: Connection, wallet: WalletLike): LoyalTransactionsClient;
    /**
     * Create client from a Connection and Keypair (for server-side scripts)
     *
     * @example
     * const connection = new Connection('https://api.devnet.solana.com');
     * const keypair = Keypair.fromSecretKey(secretKey);
     * const client = LoyalTransactionsClient.fromKeypair(connection, keypair);
     */
    static fromKeypair(connection: Connection, keypair: Keypair): LoyalTransactionsClient;
    /**
     * Deposit SOL for a Telegram username
     *
     * Creates or tops up a deposit for the specified username.
     * The deposit can later be claimed by the user who verifies
     * ownership of the Telegram account.
     *
     * @param params - Deposit parameters
     * @returns Transaction signature and updated deposit data
     *
     * @example
     * const result = await client.deposit({
     *   username: 'alice',
     *   amountLamports: 100_000_000, // 0.1 SOL
     * });
     *
     * console.log('Signature:', result.signature);
     * console.log('Deposit amount:', result.deposit.amount);
     */
    deposit(params: DepositParams): Promise<DepositResult>;
    /**
     * Refund SOL from a deposit
     *
     * Withdraws the specified amount from the deposit back to the depositor's wallet.
     * Only the original depositor can refund their deposit.
     *
     * @param params - Refund parameters
     * @returns Transaction signature and updated deposit data
     *
     * @example
     * const result = await client.refund({
     *   username: 'alice',
     *   amountLamports: 50_000_000, // 0.05 SOL
     * });
     *
     * console.log('Signature:', result.signature);
     * console.log('Remaining deposit:', result.deposit.amount);
     */
    refund(params: RefundParams): Promise<RefundResult>;
    /**
     * Get deposit data for a specific depositor and username
     *
     * @param depositor - The depositor's public key
     * @param username - The Telegram username
     * @returns Deposit data or null if not found
     *
     * @example
     * const deposit = await client.getDeposit(depositorPubkey, 'alice');
     * if (deposit) {
     *   console.log('Amount:', deposit.amount);
     * }
     */
    getDeposit(depositor: PublicKey, username: string): Promise<DepositData | null>;
    /**
     * Find the deposit PDA for a depositor and username
     *
     * @param depositor - The depositor's public key
     * @param username - The Telegram username
     * @returns [PDA address, bump seed]
     */
    findDepositPda(depositor: PublicKey, username: string): [PublicKey, number];
    /**
     * Find the vault PDA
     *
     * @returns [PDA address, bump seed]
     */
    findVaultPda(): [PublicKey, number];
    /**
     * Get the connected wallet's public key
     */
    get publicKey(): PublicKey;
    /**
     * Get the underlying Anchor program instance
     * For advanced users who need direct program access
     */
    getProgram(): Program<TelegramTransfer>;
    /**
     * Get the program ID
     */
    getProgramId(): PublicKey;
}
