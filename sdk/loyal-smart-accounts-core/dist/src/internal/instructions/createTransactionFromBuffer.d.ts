import { PublicKey } from "@solana/web3.js";
export declare function createTransactionFromBuffer({ consensusPda, creator, rentPayer, transactionIndex, bufferIndex, accountIndex, ephemeralSigners, transactionBuffer, memo, programId, }: {
    consensusPda: PublicKey;
    creator: PublicKey;
    rentPayer?: PublicKey;
    transactionIndex: bigint;
    bufferIndex: number;
    accountIndex: number;
    ephemeralSigners: number;
    transactionBuffer?: PublicKey;
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
