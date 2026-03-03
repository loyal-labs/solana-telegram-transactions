import { BN } from "@coral-xyz/anchor";
import { type Connection, Keypair, PublicKey } from "@solana/web3.js";
import type { AnchorWallet } from "@/hooks/use-anchor-wallet";

import {
  getChatAccount,
  getContextAccount,
  getLoyalOracleProgram,
  getLoyalOracleProvider,
} from "./helpers";
import type { GeneratedSolanaKeypair, UserChat, UserContext } from "./types";

/**
 * Resolves the context PDA for a wallet owner and returns account info when it exists.
 */
export async function fetchUserContext(
  connection: Connection,
  wallet: AnchorWallet
): Promise<UserContext | null> {
  const provider = getLoyalOracleProvider(connection, wallet);
  const program = getLoyalOracleProgram(provider);

  const contextAddress = getContextAccount(wallet);
  console.log(
    "Fetching context account for wallet:",
    wallet.publicKey.toBase58(),
    "with address:",
    contextAddress.toBase58()
  );
  try {
    // @ts-expect-error - TODO: fix this
    const context = await program.account.contextAccount.fetch(contextAddress);
    return {
      owner: new PublicKey(context.owner),
      nextChatId: context.nextChatId.toNumber(),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Account does not exist")
    ) {
      return null;
    }
    throw error;
  }
}
/**
 * Attempts to create the context account for the connected wallet. The user must approve the transaction.
 */
export async function initializeUserContext(
  connection: Connection,
  wallet: AnchorWallet
): Promise<UserContext> {
  if (!wallet.publicKey) {
    throw new Error("Wallet is not connected");
  }
  const provider = getLoyalOracleProvider(connection, wallet);
  const program = getLoyalOracleProgram(provider);

  const instruction = await program.methods
    .createContext()
    .accounts({
      payer: wallet.publicKey,
    })
    .rpc({ skipPreflight: true });
  console.log("Your transaction signature", instruction);

  const context = await fetchUserContext(connection, wallet);
  if (!context) {
    throw new Error("Failed to fetch context account after creation");
  }
  return context;
}

export async function fetchUserChat(
  connection: Connection,
  wallet: AnchorWallet,
  chatId: number
): Promise<UserChat | null> {
  if (!wallet.publicKey) {
    throw new Error("Wallet is not connected");
  }
  const provider = getLoyalOracleProvider(connection, wallet);
  const program = getLoyalOracleProgram(provider);

  const chatAddress = getChatAccount(wallet, chatId);
  console.log(
    "Fetching chat account for chat id:",
    chatId,
    "with address:",
    chatAddress.toBase58()
  );

  try {
    // @ts-expect-error - TODO: fix this
    const chat = await program.account.chat.fetch(chatAddress);
    console.log("Chat account found:", chat);

    return {
      address: chatAddress,
      user: chat.user,
      id: chat.id,
      createdAt: chat.createdAt,
      status: chat.status,
      cmk: chat.cmk,
      txId: chat.txId,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Account does not exist")
    ) {
      return null;
    }
    throw error;
  }
}

export async function fetchAllUserChats(
  connection: Connection,
  wallet: AnchorWallet,
  nextChatId: number
): Promise<UserChat[]> {
  if (!wallet.publicKey) {
    throw new Error("Wallet is not connected");
  }
  const chats: UserChat[] = [];
  for (let i = 0; i < nextChatId; i++) {
    const chat = await fetchUserChat(connection, wallet, i);
    if (chat) {
      chats.push(chat);
    }
  }
  return chats;
}

export async function createUserChat(
  connection: Connection,
  wallet: AnchorWallet,
  context: UserContext,
  cmk: PublicKey,
  txId: PublicKey
): Promise<undefined> {
  if (!wallet.publicKey) {
    throw new Error("Wallet is not connected");
  }
  const provider = getLoyalOracleProvider(connection, wallet);
  const program = getLoyalOracleProgram(provider);
  const contextAddress = getContextAccount(wallet);

  const instruction = await program.methods
    .createChat(new BN(context.nextChatId), cmk, txId)
    .accounts({
      payer: wallet.publicKey,
      contextAccount: contextAddress,
    })
    .rpc({ skipPreflight: true });
  console.log("Your transaction signature", instruction);
  return;
}

export const generateSolanaKeypair = (): GeneratedSolanaKeypair => {
  const keypair = Keypair.generate();

  return {
    keypair,
    publicKeyBase58: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
  };
};
