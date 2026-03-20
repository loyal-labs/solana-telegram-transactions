import { PublicKey } from "@solana/web3.js";
export declare function activateProposal({ settingsPda, transactionIndex, signer, programId, }: {
    settingsPda: PublicKey;
    transactionIndex: bigint;
    signer: PublicKey;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
