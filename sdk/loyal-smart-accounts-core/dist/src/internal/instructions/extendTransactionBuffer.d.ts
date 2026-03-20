import { PublicKey } from "@solana/web3.js";
export declare function extendTransactionBuffer({ consensusPda, creator, bufferIndex, buffer, transactionBuffer, programId, }: {
    consensusPda: PublicKey;
    creator: PublicKey;
    bufferIndex: number;
    buffer: Uint8Array;
    transactionBuffer?: PublicKey;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
