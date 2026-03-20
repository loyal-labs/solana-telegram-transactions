import { PublicKey } from "@solana/web3.js";
export declare function closeEmptyPolicyTransaction({ emptyPolicy, transactionRentCollector, transactionIndex, programId, }: {
    emptyPolicy: PublicKey;
    transactionRentCollector: PublicKey;
    transactionIndex: bigint;
    programId?: PublicKey;
    proposalRentCollector?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
