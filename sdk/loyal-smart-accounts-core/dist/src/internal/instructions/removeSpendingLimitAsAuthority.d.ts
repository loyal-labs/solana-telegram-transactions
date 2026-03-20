import { PublicKey } from "@solana/web3.js";
export declare function removeSpendingLimitAsAuthority({ settingsPda, settingsAuthority, spendingLimit, rentCollector, memo, programId, }: {
    settingsPda: PublicKey;
    settingsAuthority: PublicKey;
    spendingLimit: PublicKey;
    rentCollector: PublicKey;
    memo?: string;
    programId?: PublicKey;
}): import("@solana/web3.js").TransactionInstruction;
