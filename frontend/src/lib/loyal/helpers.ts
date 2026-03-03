import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { type Connection, PublicKey } from "@solana/web3.js";
import type { AnchorWallet } from "@/hooks/use-anchor-wallet";

import type { LoyalOracle } from "@/program/generated/loyal_oracle";
import loyalOracleIdl from "@/program/idl/loyal_oracle.json";

import { CHAT_SEED, CONTEXT_SEED, PROGRAM_ID } from "./constants";

export function getLoyalOracleProgram(provider: AnchorProvider) {
  return new Program(loyalOracleIdl as LoyalOracle, provider);
}

export function getLoyalOracleProvider(
  connection: Connection,
  wallet: AnchorWallet
) {
  return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
}

export function getContextAccount(wallet: AnchorWallet) {
  const walletAddress = wallet.publicKey;
  const seed = [CONTEXT_SEED, walletAddress.toBuffer()];
  return PublicKey.findProgramAddressSync(seed, PROGRAM_ID)[0];
}

export function getChatAccount(wallet: AnchorWallet, chatId: number) {
  const contextAddress = getContextAccount(wallet);
  const chatIdBuffer = new BN(chatId);

  const chatAddress = PublicKey.findProgramAddressSync(
    [
      CHAT_SEED,
      contextAddress.toBuffer(),
      chatIdBuffer.toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  );
  return chatAddress[0];
}
