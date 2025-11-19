import * as anchor from "@coral-xyz/anchor";
import { BN, Program, web3 } from "@coral-xyz/anchor";
import { expect } from "chai";
import { TelegramTransfer } from "../target/types/telegram_transfer";

import {
  Transaction,
  SystemProgram,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { TelegramVerification } from "../target/types/telegram_verification";

const VALIDATION_BYTES: Uint8Array = new Uint8Array([
  56, 48, 54, 53, 49, 52, 48, 52, 57, 57, 58, 87, 101, 97, 116, 97, 97, 116, 97,
  10, 97, 117, 116, 104, 95, 100, 97, 116, 101, 61, 49, 55, 54, 51, 53, 50, 50,
  52, 54, 55, 10, 99, 104, 97, 116, 95, 105, 110, 115, 116, 97, 110, 99, 101,
  61, 45, 52, 53, 57, 55, 56, 48, 55, 53, 56, 53, 54, 55, 51, 56, 52, 53, 53,
  55, 49, 10, 99, 104, 97, 116, 95, 116, 121, 112, 101, 61, 115, 117, 115, 101,
  114, 61, 123, 34, 105, 58, 56, 55, 57, 55, 55, 54, 55, 44, 34, 102, 105, 114,
  115, 116, 95, 110, 97, 109, 101, 34, 58, 34, 84, 114, 97, 118, 105, 115, 116,
  95, 110, 97, 109, 101, 34, 58, 34, 34, 44, 34, 117, 115, 101, 114, 110, 97,
  109, 101, 34, 58, 34, 49, 51, 51, 55, 49, 51, 51, 51, 55, 34, 44, 34, 108, 97,
  110, 103, 117, 97, 103, 101, 95, 99, 111, 100, 101, 34, 58, 34, 101, 110, 34,
  44, 34, 97, 108, 108, 111, 119, 115, 95, 119, 114, 105, 116, 101, 95, 116,
  111, 95, 112, 109, 34, 58, 116, 114, 117, 101, 44, 34, 112, 104, 111, 116,
  111, 95, 117, 114, 108, 34, 58, 34, 116, 116, 112, 115, 58, 92, 47, 92, 47,
  116, 46, 109, 101, 101, 114, 112, 105, 99, 92, 47, 51, 50, 48, 92, 47, 120,
  99, 90, 85, 85, 85, 87, 51, 117, 74, 50, 99, 79, 80, 86, 73, 81, 85, 111, 99,
  104, 105, 119, 72, 99, 56, 113, 118, 114, 56, 106, 114, 108, 66, 56, 74, 45,
  72, 88, 120, 105, 112, 98, 83, 74, 76, 122, 122, 118, 120, 73, 99, 79, 106,
  55, 103, 55, 70, 49, 69, 78, 116, 72, 71, 46, 115, 118, 103,
]);

const VALIDATION_SIGNATURE_BYTES: Uint8Array = new Uint8Array([
  181, 119, 170, 178, 72, 35, 92, 228, 70, 10, 178, 38, 59, 13, 126, 110, 115,
  46, 238, 87, 14, 177, 232, 229, 237, 166, 209, 137, 210, 236, 229, 14, 215,
  201, 215, 158, 12, 112, 23, 56, 220, 97, 7, 188, 15, 113, 210, 31, 10, 14,
  138, 45, 172, 55, 212, 63, 165, 121, 205, 230, 74, 38, 174, 13,
]);

describe.only("telegram-verification test suite", () => {
  const baseProvider = anchor.AnchorProvider.env();

  const userKp = web3.Keypair.generate();
  const user = userKp.publicKey;
  const wallet = new anchor.Wallet(userKp);

  const provider = new anchor.AnchorProvider(
    baseProvider.connection,
    wallet,
    baseProvider.opts
  );
  anchor.setProvider(provider);

  const program = anchor.workspace
    .TelegramVerification as Program<TelegramVerification>;

  const validationString = new TextDecoder().decode(VALIDATION_BYTES);
  console.log("Validation string:", validationString);

  before(async () => {
    const { blockhash, lastValidBlockHeight } =
      await provider.connection.getLatestBlockhash();
    const signature = await provider.connection.requestAirdrop(
      provider.wallet.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    await provider.connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );
  });

  it("Initialize program", async () => {
    await program.methods
      .initialize()
      .accounts({
        payer: user,
      })
      .rpc({ commitment: "confirmed" });
  });
});
