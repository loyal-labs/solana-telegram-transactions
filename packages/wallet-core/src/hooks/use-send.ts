import {
	LoyalTransactionsClient,
	solToLamports,
} from "@loyal-labs/transactions";
import {
	createAssociatedTokenAccountInstruction,
	createTransferInstruction,
	getAccount,
	getAssociatedTokenAddress,
} from "@solana/spl-token";
import type { Connection, Transaction } from "@solana/web3.js";
import {
	ComputeBudgetProgram,
	LAMPORTS_PER_SOL,
	PublicKey,
	SystemProgram,
	TransactionMessage,
	VersionedTransaction,
} from "@solana/web3.js";
import { useCallback, useState } from "react";

import { TOKEN_DECIMALS, TOKEN_MINTS } from "../constants/token-mints";
import type { WalletSigner } from "../types/signer";

export type SendResult = {
	signature?: string;
	success: boolean;
	error?: string;
};

const getTokenMint = (symbol: string): string | undefined => {
	return TOKEN_MINTS[symbol.toUpperCase()];
};

async function sendTransactionViaSigner(
	signer: WalletSigner,
	connection: Connection,
	transaction: VersionedTransaction,
): Promise<string> {
	if (signer.sendTransaction) {
		return signer.sendTransaction(transaction);
	}
	const signed = await signer.signTransaction(transaction);
	return connection.sendRawTransaction(signed.serialize());
}

export function useSend(
	signer: WalletSigner | null,
	connection: Connection,
) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const executeSend = useCallback(
		async (
			currency: string,
			amount: string,
			recipientAddress: string,
			destinationType: "wallet" | "telegram" = "wallet",
			tokenMint?: string,
			tokenDecimals?: number,
		): Promise<SendResult> => {
			if (!signer) {
				const error = "Wallet not connected";
				setError(error);
				return { success: false, error };
			}

			setLoading(true);
			setError(null);

			try {
				const publicKey = signer.publicKey;
				const isSol = currency.toUpperCase() === "SOL";

				// Handle Telegram deposit
				if (destinationType === "telegram") {
					if (!isSol) {
						throw new Error(
							"Only SOL can be sent to Telegram usernames.",
						);
					}

					const walletAdapter = {
						publicKey,
						signTransaction: signer.signTransaction.bind(signer) as <
							T extends Transaction | VersionedTransaction,
						>(
							tx: T,
						) => Promise<T>,
						signAllTransactions: async <
							T extends Transaction | VersionedTransaction,
						>(
							txs: T[],
						): Promise<T[]> => {
							const signedTxs: T[] = [];
							for (const tx of txs) {
								const signed = (await signer.signTransaction(
									tx,
								)) as T;
								signedTxs.push(signed);
							}
							return signedTxs;
						},
					};

					const client = LoyalTransactionsClient.fromWallet(
						connection,
						walletAdapter,
					);

					const amountLamports = solToLamports(
						Number.parseFloat(amount),
					);
					const result = await client.deposit({
						username: recipientAddress,
						amountLamports,
					});

					setLoading(false);
					return { signature: result.signature, success: true };
				}

				// Validate recipient address for wallet transfers
				let recipientPubkey: PublicKey;
				try {
					recipientPubkey = new PublicKey(recipientAddress);
				} catch {
					throw new Error("Invalid recipient wallet address");
				}

				const { blockhash, lastValidBlockHeight } =
					await connection.getLatestBlockhash();

				if (isSol) {
					const amountInLamports = Math.floor(
						Number.parseFloat(amount) * LAMPORTS_PER_SOL,
					);

					const transferInstruction = SystemProgram.transfer({
						fromPubkey: publicKey,
						toPubkey: recipientPubkey,
						lamports: amountInLamports,
					});

					const messageV0 = new TransactionMessage({
						payerKey: publicKey,
						recentBlockhash: blockhash,
						instructions: [transferInstruction],
					}).compileToV0Message();

					const transaction = new VersionedTransaction(messageV0);
					const signature = await sendTransactionViaSigner(
						signer,
						connection,
						transaction,
					);

					const confirmation = await connection.confirmTransaction(
						{ signature, blockhash, lastValidBlockHeight },
						"confirmed",
					);

					if (confirmation.value.err) {
						throw new Error(
							`Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
						);
					}

					setLoading(false);
					return { signature, success: true };
				}

				// Send SPL Token
				const resolvedTokenMint =
					tokenMint || getTokenMint(currency);
				if (!resolvedTokenMint) {
					throw new Error(
						`Unknown token: ${currency}. Please provide token mint address.`,
					);
				}

				const mintPubkey = new PublicKey(resolvedTokenMint);
				const decimals =
					tokenDecimals ??
					TOKEN_DECIMALS[currency.toUpperCase()] ??
					6;
				const amountInSmallestUnit = Math.floor(
					Number.parseFloat(amount) * 10 ** decimals,
				);

				const fromTokenAccount = await getAssociatedTokenAddress(
					mintPubkey,
					publicKey,
				);
				const toTokenAccount = await getAssociatedTokenAddress(
					mintPubkey,
					recipientPubkey,
				);

				let needsATA = false;
				try {
					await getAccount(connection, toTokenAccount);
				} catch {
					needsATA = true;
				}

				const instructions = [];

				if (needsATA) {
					instructions.push(
						ComputeBudgetProgram.setComputeUnitLimit({
							units: 300_000,
						}),
					);
					instructions.push(
						ComputeBudgetProgram.setComputeUnitPrice({
							microLamports: 1000,
						}),
					);
					instructions.push(
						createAssociatedTokenAccountInstruction(
							publicKey,
							toTokenAccount,
							recipientPubkey,
							mintPubkey,
						),
					);
				}

				instructions.push(
					createTransferInstruction(
						fromTokenAccount,
						toTokenAccount,
						publicKey,
						amountInSmallestUnit,
					),
				);

				const messageV0 = new TransactionMessage({
					payerKey: publicKey,
					recentBlockhash: blockhash,
					instructions,
				}).compileToV0Message();

				const transaction = new VersionedTransaction(messageV0);
				const signature = await sendTransactionViaSigner(
					signer,
					connection,
					transaction,
				);

				const confirmation = await connection.confirmTransaction(
					{ signature, blockhash, lastValidBlockHeight },
					"confirmed",
				);

				if (confirmation.value.err) {
					throw new Error(
						`Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
					);
				}

				setLoading(false);
				return { signature, success: true };
			} catch (err) {
				let errorMessage = "Send execution failed";
				if (err instanceof Error) {
					if (
						err.message.includes("timeout") ||
						err.message.includes("Timeout")
					) {
						errorMessage =
							"Transaction signing timed out. Please try again and approve the transaction in your wallet promptly.";
					} else if (err.message.includes("User rejected")) {
						errorMessage =
							"Transaction was rejected in your wallet.";
					} else {
						errorMessage = err.message;
					}
				}
				setError(errorMessage);
				setLoading(false);
				return { success: false, error: errorMessage };
			}
		},
		[signer, connection],
	);

	return { executeSend, loading, error };
}
