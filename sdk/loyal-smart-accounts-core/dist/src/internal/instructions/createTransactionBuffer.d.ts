import { PublicKey } from "@solana/web3.js";
export declare function createTransactionBuffer({ consensusPda, creator, rentPayer, bufferIndex, accountIndex, finalBufferHash, finalBufferSize, buffer, transactionBuffer, programId, }: {
    consensusPda: PublicKey;
    creator: PublicKey;
    rentPayer?: PublicKey;
    bufferIndex: number;
    accountIndex: number;
    finalBufferHash: number[] | Uint8Array;
    finalBufferSize: number;
    buffer: Uint8Array;
    transactionBuffer?: PublicKey;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
