// import * as anchor from "@coral-xyz/anchor";
// import { BN, Program, web3 } from "@coral-xyz/anchor";
// import { expect } from "chai";
// import { TelegramTransfer } from "../target/types/telegram_transfer";

// import {
//   Transaction,
//   SystemProgram,
//   PublicKey,
//   Keypair,
//   LAMPORTS_PER_SOL,
// } from "@solana/web3.js";

// describe.only("telegram-transfer", () => {
//   const baseProvider = anchor.AnchorProvider.env();

//   const userKp = web3.Keypair.generate();
//   const user = userKp.publicKey;
//   const wallet = new anchor.Wallet(userKp);

//   const otherUserKp = web3.Keypair.generate();
//   const otherUser = otherUserKp.publicKey;
//   const otherWallet = new anchor.Wallet(otherUserKp);

//   const initialAmount = LAMPORTS_PER_SOL * 6;

//   const provider = new anchor.AnchorProvider(
//     baseProvider.connection,
//     wallet,
//     baseProvider.opts
//   );
//   anchor.setProvider(provider);

//   const program = anchor.workspace
//     .TelegramTransfer as Program<TelegramTransfer>;

//   const providerEphemeralRollup = new anchor.AnchorProvider(
//     new anchor.web3.Connection(
//       process.env.EPHEMERAL_PROVIDER_ENDPOINT ||
//         "https://devnet-us.magicblock.app/",
//       {
//         wsEndpoint:
//           process.env.EPHEMERAL_WS_ENDPOINT ||
//           "wss://devnet-us.magicblock.app/",
//       }
//     ),
//     wallet,
//     provider.opts
//   );

//   const ephemeralProgram = new Program<TelegramTransfer>(
//     program.idl,
//     providerEphemeralRollup
//   );

//   const vaultPda = PublicKey.findProgramAddressSync(
//     [Buffer.from("vault")],
//     program.programId
//   )[0];

//   const depositPda = PublicKey.findProgramAddressSync(
//     [Buffer.from("deposit"), user.toBuffer()],
//     program.programId
//   )[0];

//   const otherDepositPda = PublicKey.findProgramAddressSync(
//     [Buffer.from("deposit"), otherUser.toBuffer()],
//     program.programId
//   )[0];

//   before(async () => {
//     const { blockhash, lastValidBlockHeight } =
//       await provider.connection.getLatestBlockhash();
//     const signature = await provider.connection.requestAirdrop(
//       provider.wallet.publicKey,
//       initialAmount * 2
//     );
//     const signature2 = await provider.connection.requestAirdrop(
//       otherWallet.publicKey,
//       initialAmount * 2
//     );

//     await provider.connection.confirmTransaction(
//       {
//         signature,
//         blockhash,
//         lastValidBlockHeight,
//       },
//       "confirmed"
//     );
//     await provider.connection.confirmTransaction(
//       {
//         signature: signature2,
//         blockhash,
//         lastValidBlockHeight,
//       },
//       "confirmed"
//     );
//   });

//   it("Initialize program", async () => {
//     await program.methods
//       .initialize()
//       .accounts({
//         payer: user,
//         user: user,
//       })
//       .rpc({ commitment: "confirmed" });

//     const deposit = await program.account.deposit.fetch(depositPda);
//     expect(deposit.amount.toNumber()).to.equal(0);
//     expect(deposit.user.toBase58()).to.equal(
//       provider.wallet.publicKey.toBase58()
//     );

//     await program.methods
//       .initialize()
//       .accounts({
//         payer: provider.wallet.publicKey,
//         user: otherWallet.publicKey,
//       })
//       .rpc({ commitment: "confirmed" });

//     const otherDeposit = await program.account.deposit.fetch(otherDepositPda);
//     expect(otherDeposit.amount.toNumber()).to.equal(0);
//     expect(otherDeposit.user.toBase58()).to.equal(
//       otherWallet.publicKey.toBase58()
//     );
//   });

//   it("Modify deposit for the first time", async () => {
//     await program.methods
//       .modifyDeposit({
//         amount: new BN(initialAmount / 2),
//         increase: true,
//       })
//       .accounts({
//         payer: user,
//         // @ts-ignore
//         user: user,
//         vault: vaultPda,
//         deposit: depositPda,
//         systemProgram: SystemProgram.programId,
//       })
//       .rpc({ skipPreflight: true });

//     let deposit = await program.account.deposit.fetch(depositPda);
//     expect(deposit.amount.toNumber()).to.equal(initialAmount / 2);

//     await program.methods
//       .modifyDeposit({
//         amount: new BN(initialAmount / 4),
//         increase: false,
//       })
//       .accounts({
//         payer: user,
//         // @ts-ignore
//         user: user,
//         vault: vaultPda,
//         deposit: depositPda,
//         systemProgram: SystemProgram.programId,
//       })
//       .rpc({ skipPreflight: true });

//     deposit = await program.account.deposit.fetch(depositPda);
//     expect(deposit.amount.toNumber()).to.equal(initialAmount / 4);

//     await program.methods
//       .modifyDeposit({
//         amount: new BN((3 * initialAmount) / 4),
//         increase: true,
//       })
//       .accounts({
//         payer: user,
//         // @ts-ignore
//         user: user,
//         vault: vaultPda,
//         deposit: depositPda,
//         systemProgram: SystemProgram.programId,
//       })
//       .rpc({ skipPreflight: true });

//     deposit = await program.account.deposit.fetch(depositPda);
//     expect(deposit.amount.toNumber()).to.equal(initialAmount);
//   });

//   it("Delegate deposit", async () => {
//     await program.methods
//       .delegate(user)
//       .accounts({
//         payer: user,
//         // @ts-ignore
//         deposit: depositPda,
//       })
//       .rpc({ skipPreflight: true });

//     await program.methods
//       .delegate(otherUser)
//       .accounts({
//         payer: otherUser,
//         // @ts-ignore
//         deposit: otherDepositPda,
//       })
//       .signers([otherUserKp])
//       .rpc({ skipPreflight: true });
//   });

//   it("Delegated transfer deposit", async () => {
//     let deposit = await program.account.deposit.fetch(depositPda);
//     let otherDeposit = await program.account.deposit.fetch(otherDepositPda);

//     await ephemeralProgram.methods
//       .transferDeposit(new BN(initialAmount / 2))
//       .accounts({
//         // @ts-ignore
//         user: user,
//         sourceDeposit: depositPda,
//         destinationDeposit: otherDepositPda,
//       })
//       .signers([userKp])
//       .rpc({ skipPreflight: true });

//     deposit = await ephemeralProgram.account.deposit.fetch(depositPda);
//     expect(deposit.amount.toNumber()).to.equal(initialAmount / 2);

//     otherDeposit = await ephemeralProgram.account.deposit.fetch(
//       otherDepositPda
//     );
//     expect(otherDeposit.amount.toNumber()).to.equal(initialAmount / 2);

//     await ephemeralProgram.methods
//       .transferDeposit(new BN(initialAmount / 4))
//       .accounts({
//         // @ts-ignore
//         user: otherUser,
//         sourceDeposit: otherDepositPda,
//         destinationDeposit: depositPda,
//       })
//       .rpc({ skipPreflight: true });

//     deposit = await ephemeralProgram.account.deposit.fetch(depositPda);
//     otherDeposit = await ephemeralProgram.account.deposit.fetch(
//       otherDepositPda
//     );
//     expect(deposit.amount.toNumber()).to.equal((initialAmount * 1.5) / 2);
//     expect(otherDeposit.amount.toNumber()).to.equal(initialAmount / 4);
//   });

//   it("Undelegate deposit", async () => {
//     await ephemeralProgram.methods
//       .undelegate(user)
//       .accounts({
//         payer: user,
//         // @ts-ignore
//         deposit: depositPda,
//       })
//       .rpc();

//     console.log("Other user", otherUser.toBase58());

//     await ephemeralProgram.methods
//       .undelegate(otherUser)
//       .accounts({
//         payer: otherUser,
//         // @ts-ignore
//         deposit: otherDepositPda,
//       })
//       .signers([otherUserKp])
//       .rpc();

//     // wait for 1 second
//     // await new Promise((resolve) => setTimeout(resolve, 1000));
//   });

//   // it("Check undelegated deposit", async () => {
//   //   let deposit = await program.account.deposit.fetch(depositPda);
//   //   console.log("Deposit amount", deposit.amount.toNumber());
//   //   expect(deposit.amount.toNumber()).to.equal(3000000000);
//   // });
// });
