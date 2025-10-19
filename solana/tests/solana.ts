import * as anchor from "@coral-xyz/anchor";
import { BN, Program, web3 } from "@coral-xyz/anchor";
import { expect } from "chai";
import { LoyalOracle } from "../target/types/loyal_oracle";

describe.only("loyal-oracle", () => {
  const baseProvider = anchor.AnchorProvider.env();
  // anchor.setProvider(provider);
  const cmk = web3.Keypair.generate().publicKey;
  const txId = web3.Keypair.generate().publicKey;
  const chatId = new BN(0);
  const STATUS_PENDING = 1;
  const STATUS_DONE = 2;

  const oracleKeypair: web3.Keypair = (baseProvider.wallet as any).payer;
  const testKeypair = web3.Keypair.generate();
  const testWallet = new anchor.Wallet(testKeypair);

  const provider = new anchor.AnchorProvider(
    baseProvider.connection,
    testWallet,
    baseProvider.opts
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.LoyalOracle as Program<LoyalOracle>;
  const providerEphemeralRollup = new anchor.AnchorProvider(
    new anchor.web3.Connection(
      process.env.EPHEMERAL_PROVIDER_ENDPOINT ||
        "https://devnet-us.magicblock.app/",
      {
        wsEndpoint:
          process.env.EPHEMERAL_WS_ENDPOINT ||
          "wss://devnet-us.magicblock.app/",
      }
    ),
    // anchor.Wallet.local()
    testWallet,
    provider.opts
  );

  const topUp = true;
  const expiryInMinutes = 60;

  const ephemeralProgram = new Program<LoyalOracle>(
    program.idl,
    providerEphemeralRollup
  );

  const [contextAccount, contextBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("context"), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  const [chatAddress, chatBump] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("chat"),
      contextAccount.toBuffer(),
      chatId.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  before(async () => {
    const { blockhash, lastValidBlockHeight } =
      await provider.connection.getLatestBlockhash();
    const signature = await provider.connection.requestAirdrop(
      provider.wallet.publicKey,
      web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    const baseSignature = await provider.connection.requestAirdrop(
      oracleKeypair.publicKey,
      web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(
      {
        signature: baseSignature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );
  });
});
