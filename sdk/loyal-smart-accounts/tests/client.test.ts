import { describe, expect, it } from "bun:test";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import * as sdk from "../index";

describe("client transport", () => {
  it("sends prepared operations through sendPrepared", async () => {
    const creator = Keypair.generate();
    const treasury = Keypair.generate().publicKey;
    const [settingsPda] = sdk.pda.getSettingsPda({ accountIndex: 1n });
    let receivedSignerCount = 0;
    let compiledUnsignedTransaction: VersionedTransaction | null = null;

    const client = sdk.createLoyalSmartAccountsClient({
      connection: {
        getLatestBlockhash: async () => ({
          blockhash: Keypair.generate().publicKey.toBase58(),
          lastValidBlockHeight: 123,
        }),
      } as unknown as Connection,
      sendPrepared: async (_prepared, signers, context) => {
        receivedSignerCount = signers.length;
        compiledUnsignedTransaction = context.compileUnsignedTransaction();
        return "signature-123";
      },
    });

    const signature = await client.smartAccounts.create({
      treasury,
      creator,
      settings: settingsPda,
      settingsAuthority: null,
      threshold: 1,
      signers: [
        {
          key: creator.publicKey,
          permissions: sdk.codecs.Permissions.all(),
        },
      ],
      timeLock: 0,
      rentCollector: null,
    });

    expect(signature).toBe("signature-123");
    expect(receivedSignerCount).toBe(1);
    expect(
      compiledUnsignedTransaction?.signatures.every((signatureBytes) =>
        signatureBytes.every((value) => value === 0)
      ) ?? false
    ).toBe(true);
  });

  it("lets callers send a prepared operation explicitly", async () => {
    const creator = Keypair.generate();
    const treasury = Keypair.generate().publicKey;
    const prepared = await sdk.smartAccounts.prepare.create({
      creator: creator.publicKey,
      treasury,
      settingsAuthority: null,
      threshold: 1,
      signers: [
        {
          key: creator.publicKey,
          permissions: sdk.codecs.Permissions.all(),
        },
      ],
      timeLock: 0,
      rentCollector: null,
    });

    const client = sdk.createLoyalSmartAccountsClient({
      connection: {
        getLatestBlockhash: async () => ({
          blockhash: Keypair.generate().publicKey.toBase58(),
          lastValidBlockHeight: 321,
        }),
        sendTransaction: async () => "signature-explicit",
      } as unknown as Connection,
    });

    const signature = await client.send(prepared, {
      signers: [creator],
    });

    expect(signature).toBe("signature-explicit");
  });
});
