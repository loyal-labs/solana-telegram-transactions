import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { WebUploader } from "@irys/web-upload";
import { WebSolana } from "@irys/web-upload-solana";
import {
  type Connection,
  Keypair,
  type PublicKey,
  type Transaction,
} from "@solana/web3.js";
import nacl from "tweetnacl";

function makeEphemeralProvider(keypair: Keypair, connection: Connection) {
  const publicKey = keypair.publicKey as PublicKey;

  return {
    publicKey,
    async signMessage(message: Uint8Array) {
      // Irys expects a Uint8Array signature
      const msg =
        message instanceof Uint8Array
          ? message
          : new TextEncoder().encode(String(message));
      return nacl.sign.detached(msg, keypair.secretKey);
    },
    async signTransaction(tx: Transaction) {
      tx.partialSign(keypair);
      return tx;
    },
    async signAllTransactions(txs: Transaction[]) {
      txs.forEach((t) => t.partialSign(keypair));
      return txs;
    },
    async sendTransaction(tx: Transaction) {
      tx.partialSign(keypair);
      return connection.sendRawTransaction(tx.serialize());
    },
  };
}

export function createOrRestoreEphemeralKeypair() {
  const stash = sessionStorage.getItem("ephemeral-secret");
  const kp = stash
    ? Keypair.fromSecretKey(bs58.decode(stash))
    : Keypair.generate();
  if (!stash)
    sessionStorage.setItem("ephemeral-secret", bs58.encode(kp.secretKey));
  console.log("Ephemeral secret", stash);
  return kp;
}

export async function getIrysUploader(kp: Keypair, connection: Connection) {
  const provider = makeEphemeralProvider(kp, connection);
  const irysUploader = await WebUploader(WebSolana).withProvider(provider);

  console.log(`Connected to Irys as ${kp.publicKey.toBase58()}`);
  return irysUploader;
}
