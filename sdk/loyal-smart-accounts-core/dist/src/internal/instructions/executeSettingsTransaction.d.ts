import { PublicKey } from "@solana/web3.js";
export declare function executeSettingsTransaction({ settingsPda, transactionIndex, signer, rentPayer, spendingLimits, policies, programId, }: {
    settingsPda: PublicKey;
    transactionIndex: bigint;
    signer: PublicKey;
    rentPayer?: PublicKey;
    /** In case the transaction adds or removes SpendingLimits, pass the array of their Pubkeys here. */
    spendingLimits?: PublicKey[];
    policies?: PublicKey[];
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
