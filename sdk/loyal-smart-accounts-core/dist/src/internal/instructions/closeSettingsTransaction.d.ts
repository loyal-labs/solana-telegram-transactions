import { PublicKey } from "@solana/web3.js";
export declare function closeSettingsTransaction({ settingsPda, transactionRentCollector, transactionIndex, programId, proposalRentCollector, }: {
    settingsPda: PublicKey;
    transactionRentCollector: PublicKey;
    transactionIndex: bigint;
    programId?: PublicKey;
    proposalRentCollector?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
