import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { IDL, type TelegramTransfer } from "./idl";
import { PROGRAM_ID } from "./constants";
import { findDepositPda, findVaultPda } from "./pda";
import { InternalWalletAdapter } from "./wallet-adapter";
import type {
  WalletSigner,
  WalletLike,
  DepositParams,
  DepositResult,
  DepositData,
} from "./types";

/**
 * Create a typed Program instance from the IDL
 */
function createProgram(provider: AnchorProvider): Program<TelegramTransfer> {
  return new Program(IDL as TelegramTransfer, provider);
}

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
export class LoyalTransactionsClient {
  private readonly program: Program<TelegramTransfer>;
  private readonly wallet: WalletLike;

  private constructor(program: Program<TelegramTransfer>, wallet: WalletLike) {
    this.program = program;
    this.wallet = wallet;
  }

  // ============================================================
  // Factory Methods
  // ============================================================

  /**
   * Create client from an AnchorProvider (for existing Anchor projects)
   *
   * @example
   * const provider = AnchorProvider.env();
   * const client = LoyalTransactionsClient.fromProvider(provider);
   */
  static fromProvider(provider: AnchorProvider): LoyalTransactionsClient {
    const program = createProgram(provider);
    const wallet = InternalWalletAdapter.from(provider);
    return new LoyalTransactionsClient(program, wallet);
  }

  /**
   * Create client from any supported signer type
   * Automatically detects the signer type and creates the appropriate client
   *
   * @example
   * // Works with any signer type
   * const client = LoyalTransactionsClient.from(connection, signer);
   */
  static from(
    connection: Connection,
    signer: WalletSigner
  ): LoyalTransactionsClient {
    const adapter = InternalWalletAdapter.from(signer);
    const provider = new AnchorProvider(connection, adapter, {
      commitment: "confirmed",
    });
    const program = createProgram(provider);
    return new LoyalTransactionsClient(program, adapter);
  }

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
  static fromWallet(
    connection: Connection,
    wallet: WalletLike
  ): LoyalTransactionsClient {
    return LoyalTransactionsClient.from(connection, wallet);
  }

  /**
   * Create client from a Connection and Keypair (for server-side scripts)
   *
   * @example
   * const connection = new Connection('https://api.devnet.solana.com');
   * const keypair = Keypair.fromSecretKey(secretKey);
   * const client = LoyalTransactionsClient.fromKeypair(connection, keypair);
   */
  static fromKeypair(
    connection: Connection,
    keypair: Keypair
  ): LoyalTransactionsClient {
    return LoyalTransactionsClient.from(connection, keypair);
  }

  // ============================================================
  // Transaction Methods
  // ============================================================

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
  async deposit(params: DepositParams): Promise<DepositResult> {
    const { username, amountLamports, commitment = "confirmed" } = params;

    // Validate params
    if (!username || username.length < 5 || username.length > 32) {
      throw new Error("Username must be between 5 and 32 characters");
    }
    if (amountLamports <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const depositor = this.wallet.publicKey;
    const amountBN = new BN(amountLamports.toString());

    // Execute the deposit transaction
    const signature = await this.program.methods
      .depositForUsername(username, amountBN)
      .accounts({
        payer: depositor,
        depositor: depositor,
      })
      .rpc({ commitment });
    console.log("Transaction:", signature);

    // Fetch updated deposit data
    const deposit = await this.getDeposit(depositor, username);
    console.log("Deposit:", deposit);
    if (!deposit) {
      throw new Error("Failed to fetch deposit account after transaction");
    }

    return {
      signature,
      deposit,
    };
  }

  // ============================================================
  // Query Methods
  // ============================================================

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
  async getDeposit(
    depositor: PublicKey,
    username: string
  ): Promise<DepositData | null> {
    const [depositPda] = findDepositPda(depositor, username);

    try {
      const account = await this.program.account.deposit.fetch(depositPda);

      return {
        user: account.user,
        username: account.username,
        amount: account.amount.toNumber(),
        lastNonce: account.lastNonce.toNumber(),
        address: depositPda,
      };
    } catch {
      // Account doesn't exist
      return null;
    }
  }

  // ============================================================
  // PDA Helpers
  // ============================================================

  /**
   * Find the deposit PDA for a depositor and username
   *
   * @param depositor - The depositor's public key
   * @param username - The Telegram username
   * @returns [PDA address, bump seed]
   */
  findDepositPda(depositor: PublicKey, username: string): [PublicKey, number] {
    return findDepositPda(depositor, username, PROGRAM_ID);
  }

  /**
   * Find the vault PDA
   *
   * @returns [PDA address, bump seed]
   */
  findVaultPda(): [PublicKey, number] {
    return findVaultPda(PROGRAM_ID);
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
   * For advanced users who need direct program access
   */
  getProgram(): Program<TelegramTransfer> {
    return this.program;
  }

  /**
   * Get the program ID
   */
  getProgramId(): PublicKey {
    return PROGRAM_ID;
  }
}
