import * as anchor from "@coral-xyz/anchor";
import { BN, Program, web3 } from "@coral-xyz/anchor";
import { expect } from "chai";
import { Program, Idl } from "@coral-xyz/anchor";

import {
  Transaction,
  SystemProgram,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

describe.only("telegram-private-transfer test suite", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const userKp = web3.Keypair.generate();
  const user = userKp.publicKey;
  const wallet = new anchor.Wallet(userKp);

  const otherUserKp = web3.Keypair.generate();
  const otherUser = otherUserKp.publicKey;
  const otherWallet = new anchor.Wallet(otherUserKp);

  const thirduserKp = web3.Keypair.generate();
  const thirdUser = thirduserKp.publicKey;
  const thirdWallet = new anchor.Wallet(thirduserKp);

  const initialAmount = LAMPORTS_PER_SOL * 6;

  // If you run `anchor build`, Anchor will generate the typed IDL at
  // `target/types/telegram_private_transfer.ts`.
  const privateTransferProgram = anchor.workspace
    .TelegramPrivateTransfer as Program<Idl>;

  let vaultPda: PublicKey;
  let depositPda: PublicKey;

  before(async () => {
    const { blockhash, lastValidBlockHeight } =
      await provider.connection.getLatestBlockhash();
    const signature = await provider.connection.requestAirdrop(
      user,
      initialAmount
    );
    const signature2 = await provider.connection.requestAirdrop(
      otherUser,
      initialAmount
    );
    const signature3 = await provider.connection.requestAirdrop(
      thirdUser,
      initialAmount
    );

    await provider.connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    await provider.connection.confirmTransaction(
      {
        signature: signature2,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    await provider.connection.confirmTransaction(
      {
        signature: signature3,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );
  });

  it("Initialize (rpc + logs)", async () => {
    const signature = await privateTransferProgram.methods
      .initialize()
      .rpc({ commitment: "confirmed" });

    const tx = await provider.connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    // The `msg!` output (e.g. "Greetings from: ...") appears here.
    console.log("program logs:", tx?.meta?.logMessages ?? []);
  });

  it("Initialize (simulate to read logs)", async () => {
    const sim = await privateTransferProgram.methods.initialize().simulate();
    console.log("simulate logs:", sim.logs ?? []);
  });

  it("Create deposit for user A and put money in the vault", async () => {
    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      privateTransferProgram.programId
    );

    [depositPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("deposit"), user.toBuffer()],
      privateTransferProgram.programId
    );

    let totalDepositedBefore = 0;
    try {
      totalDepositedBefore = (
        await privateTransferProgram.account.vault.fetch(vaultPda)
      ).totalDeposited.toNumber();
    } catch {}

    let depositAmountBefore = 0;
    try {
      depositAmountBefore = await privateTransferProgram.account.deposit
        .fetch(depositPda)
        .amount.toNumber();
    } catch {}

    await privateTransferProgram.methods
      .makeDeposit(new BN(initialAmount / 2))
      .accounts({
        payer: user,
        depositor: user,
      })
      .signers([userKp])
      .rpc({ commitment: "confirmed" });

    const totalDepositedAfter = (
      await privateTransferProgram.account.vault.fetch(vaultPda)
    ).totalDeposited.toNumber();
    expect(totalDepositedAfter - totalDepositedBefore).to.equal(
      initialAmount / 2
    );

    const depositAfter = await privateTransferProgram.account.deposit.fetch(
      depositPda
    );
    expect(depositAfter.amount.toNumber() - depositAmountBefore).to.equal(
      initialAmount / 2
    );
    expect(depositAfter.user.toBase58()).to.equal(user.toBase58());
  });
});
