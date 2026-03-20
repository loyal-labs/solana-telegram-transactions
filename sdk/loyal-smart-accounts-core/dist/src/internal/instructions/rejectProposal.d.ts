import { PublicKey } from "@solana/web3.js";
export declare function rejectProposal({ settingsPda, transactionIndex, signer, memo, programId, }: {
    settingsPda: PublicKey;
    transactionIndex: bigint;
    signer: PublicKey;
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
