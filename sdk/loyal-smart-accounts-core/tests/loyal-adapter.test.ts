import { describe, expect, it } from "bun:test";
import { Buffer } from "buffer";
import { Keypair, TransactionInstruction } from "@solana/web3.js";
import {
  compilePreparedOperation,
  createTransport,
  sendPreparedOperation,
  type PreparedLoyalSmartAccountsOperation,
} from "../index";
import { createLoyalSmartAccountsClientFromEnv as createClientFromEnv } from "../loyal";

function createPreparedOperationFixture(): PreparedLoyalSmartAccountsOperation<"fixture"> {
  return Object.freeze({
    operation: "fixture",
    payer: Keypair.generate().publicKey,
    programId: Keypair.generate().publicKey,
    instructions: Object.freeze([
      new TransactionInstruction({
        keys: [],
        programId: Keypair.generate().publicKey,
        data: Buffer.alloc(0),
      }),
    ]),
    lookupTableAccounts: Object.freeze([]),
  });
}

function hasNonZeroSignature(signature: Uint8Array): boolean {
  return signature.some((byte) => byte !== 0);
}

describe("loyal adapter", () => {
  it("reuses cached connections for the same env and commitment", () => {
    const createdConnections: Array<{
      rpcEndpoint: string;
      websocketEndpoint: string;
      commitment: string;
    }> = [];

    const first = createClientFromEnv({
      env: "devnet",
      createConnection: (rpcEndpoint, websocketEndpoint, commitment) => {
        const connection = {
          rpcEndpoint,
          websocketEndpoint,
          commitment,
        };
        createdConnections.push(connection);
        return connection as never;
      },
    });

    const second = createClientFromEnv({
      env: "devnet",
      createConnection: (rpcEndpoint, websocketEndpoint, commitment) => {
        const connection = {
          rpcEndpoint,
          websocketEndpoint,
          commitment,
        };
        createdConnections.push(connection);
        return connection as never;
      },
    });

    expect(createdConnections).toHaveLength(1);
    expect(first.connection).toBe(second.connection);
  });

  it("isolates cached connections by commitment", () => {
    const createdConnections: string[] = [];

    createClientFromEnv({
      env: "localnet",
      commitment: "processed",
      createConnection: (rpcEndpoint, websocketEndpoint, commitment) => {
        createdConnections.push(
          `${rpcEndpoint}::${websocketEndpoint}::${commitment}`
        );
        return {
          rpcEndpoint,
          websocketEndpoint,
          commitment,
        } as never;
      },
    });

    createClientFromEnv({
      env: "localnet",
      commitment: "confirmed",
      createConnection: (rpcEndpoint, websocketEndpoint, commitment) => {
        createdConnections.push(
          `${rpcEndpoint}::${websocketEndpoint}::${commitment}`
        );
        return {
          rpcEndpoint,
          websocketEndpoint,
          commitment,
        } as never;
      },
    });

    expect(createdConnections).toHaveLength(2);
    expect(new Set(createdConnections).size).toBe(2);
  });
});

describe("transport", () => {
  it("compiles prepared operations deterministically", () => {
    const prepared = createPreparedOperationFixture();
    const transaction = compilePreparedOperation({
      prepared,
      blockhash: "EETubP5AKH4cGF4BPPdNLxWmHkg6dADww7fW7brgVWpj",
    });

    expect(transaction.message.staticAccountKeys[0].toBase58()).toBe(
      prepared.payer.toBase58()
    );
  });

  it("passes an unsigned transaction compiler into custom send hooks", async () => {
    const signer = Keypair.generate();
    const prepared = Object.freeze({
      ...createPreparedOperationFixture(),
      payer: signer.publicKey,
    });

    let observedUnsignedSignature = false;

    const transport = createTransport({
      connection: {
        getLatestBlockhash: async () => ({
          blockhash: "EETubP5AKH4cGF4BPPdNLxWmHkg6dADww7fW7brgVWpj",
          lastValidBlockHeight: 42,
        }),
      } as never,
      sendPrepared: async (_prepared, _signers, context) => {
        const transaction = context.compileUnsignedTransaction();
        observedUnsignedSignature = transaction.signatures.every(
          (signature) => !hasNonZeroSignature(signature)
        );
        return "custom-signature";
      },
    });

    const signature = await sendPreparedOperation({
      transport,
      prepared,
      signers: [signer],
    });

    expect(signature).toBe("custom-signature");
    expect(observedUnsignedSignature).toBe(true);
  });

  it("signs only inside the send phase for the default transport path", async () => {
    const signer = Keypair.generate();
    const prepared = Object.freeze({
      ...createPreparedOperationFixture(),
      payer: signer.publicKey,
    });

    let sentWithSignature = false;

    const transport = createTransport({
      connection: {
        getLatestBlockhash: async () => ({
          blockhash: "EETubP5AKH4cGF4BPPdNLxWmHkg6dADww7fW7brgVWpj",
          lastValidBlockHeight: 7,
        }),
        sendTransaction: async (transaction: { signatures: Uint8Array[] }) => {
          sentWithSignature = transaction.signatures.some((signature) =>
            hasNonZeroSignature(signature)
          );
          return "network-signature";
        },
      } as never,
    });

    const signature = await sendPreparedOperation({
      transport,
      prepared,
      signers: [signer],
    });

    expect(signature).toBe("network-signature");
    expect(sentWithSignature).toBe(true);
  });
});

describe("subpath exports", () => {
  it("exposes the Loyal env adapter from the dedicated loyal entry", () => {
    expect(typeof createClientFromEnv).toBe("function");
  });
});
