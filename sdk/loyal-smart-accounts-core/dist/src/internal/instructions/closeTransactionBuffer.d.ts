import { PublicKey } from "@solana/web3.js";
export declare function closeTransactionBuffer({ consensusPda, creator, bufferIndex, transactionBuffer, programId, }: {
    consensusPda: PublicKey;
    creator: PublicKey;
    bufferIndex: number;
    transactionBuffer?: PublicKey;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
